import { createHash } from "node:crypto";
import { findMissingFields } from "../booking/reservation-service.js";
import {
  ReservationDraftSchema,
  type ReservationDraft
} from "../shared/schemas.js";
import {
  RESERVATION_CHALLENGE_FIELDS,
  ReservationChallengeDatasetSchema,
  type ReservationChallengeField,
  type ReservationChallengeMessage
} from "./reservation-challenge-schema.js";
import {
  RESERVATION_CHALLENGE_EVALUATOR,
  ReservationChallengeSha256Schema,
  type ReservationChallengeFailureReason,
  type ReservationChallengeReport
} from "./reservation-challenge-report.js";
import {
  summarizeChallengeOutcomes,
  type ChallengeOutcome
} from "./reservation-challenge-metrics.js";

export type ReservationChallengeExtractor = (
  message: ReservationChallengeMessage
) => unknown | Promise<unknown>;

export async function evaluateReservationChallenge(
  input: unknown,
  extractor: ReservationChallengeExtractor,
  exactDatasetSha256?: string
): Promise<ReservationChallengeReport> {
  const dataset = ReservationChallengeDatasetSchema.parse(input);
  const datasetSha256 = exactDatasetSha256 === undefined
    ? createHash("sha256").update(JSON.stringify(dataset)).digest("hex")
    : ReservationChallengeSha256Schema.parse(exactDatasetSha256);
  const outcomes: ChallengeOutcome[] = [];
  const failures: ReservationChallengeReport["failures"][number][] = [];

  for (const challengeCase of dataset.cases) {
    let rawOutput: unknown;
    try {
      rawOutput = await extractor(challengeCase.input);
    } catch {
      outcomes.push({
        kind: "extractor_error",
        id: challengeCase.id,
        category: challengeCase.category
      });
      failures.push({
        id: challengeCase.id,
        category: challengeCase.category,
        reasons: ["extractor_error"]
      });
      continue;
    }

    const output = ReservationDraftSchema.safeParse(rawOutput);
    if (!output.success) {
      outcomes.push({
        kind: "invalid_output",
        id: challengeCase.id,
        category: challengeCase.category
      });
      failures.push({
        id: challengeCase.id,
        category: challengeCase.category,
        reasons: ["invalid_output"]
      });
      continue;
    }

    const actualMissing = [...new Set(findMissingFields(output.data))].sort();
    const actualRoute = actualMissing.length === 0
      ? "created"
      : "needs_confirmation";
    const fieldMatches = {
      destination: normalize(output.data, "destination")
        === challengeCase.expected.fields.destination,
      startDate: normalize(output.data, "startDate")
        === challengeCase.expected.fields.startDate,
      travelers: normalize(output.data, "travelers")
        === challengeCase.expected.fields.travelers,
      productName: normalize(output.data, "productName")
        === challengeCase.expected.fields.productName
    };
    const confirmationSetExact = sameSet(
      actualMissing,
      challengeCase.expected.confirmationFields
    );
    const reasons: ReservationChallengeFailureReason[] = RESERVATION_CHALLENGE_FIELDS
      .filter((field) => !fieldMatches[field]);
    if (actualRoute !== challengeCase.expected.route) reasons.push("route");
    if (!confirmationSetExact) reasons.push("confirmation_fields");
    outcomes.push({
      kind: "valid",
      id: challengeCase.id,
      category: challengeCase.category,
      fieldMatches,
      expectedMissing: challengeCase.expected.confirmationFields,
      actualMissing,
      expectedRoute: challengeCase.expected.route,
      actualRoute,
      confirmationSetExact,
      reasons
    });
    if (reasons.length > 0) {
      failures.push({
        id: challengeCase.id,
        category: challengeCase.category,
        reasons
      });
    }
  }

  return {
    dataset: {
      name: dataset.name,
      schemaVersion: dataset.schemaVersion,
      createdAt: dataset.createdAt,
      language: "ko",
      domain: dataset.domain,
      source: dataset.provenance.source,
      containsPersonalData: dataset.provenance.containsPersonalData,
      cases: dataset.cases.length,
      sha256: datasetSha256
    },
    evaluator: RESERVATION_CHALLENGE_EVALUATOR,
    summary: summarizeChallengeOutcomes(
      outcomes,
      [...new Set(dataset.cases.map((challengeCase) => challengeCase.category))]
    ),
    failures
  };
}

function normalize(
  draft: ReservationDraft,
  field: ReservationChallengeField
): string | number | null {
  return draft[field] ?? null;
}

function sameSet(actual: readonly string[], expected: readonly string[]): boolean {
  const actualSet = new Set(actual);
  return actualSet.size === expected.length
    && expected.every((field) => actualSet.has(field));
}
