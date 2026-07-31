import { z } from "zod";
import {
  RESERVATION_CHALLENGE_EVALUATOR,
  ReservationChallengeFailureReasonSchema,
  ReservationChallengeSha256Schema,
  ReservationChallengeSummarySchema,
  type ProportionMetric,
  type ReservationChallengeReport
} from "./reservation-challenge-report.js";

const BaselineFailureSchema = z.strictObject({
  id: z.string().min(1).max(100),
  category: z.string().min(1).max(80),
  reasons: z.array(ReservationChallengeFailureReasonSchema).min(1).readonly()
}).superRefine((failure, context) => {
  if (new Set(failure.reasons).size !== failure.reasons.length) {
    context.addIssue({
      code: "custom",
      path: ["reasons"],
      message: "Known failure reasons must be unique"
    });
  }
}).readonly();

export const ReservationChallengeBaselineSchema = z.strictObject({
  schemaVersion: z.literal(2),
  dataset: z.strictObject({
    name: z.string().min(1).max(100),
    schemaVersion: z.literal(2),
    createdAt: z.string().date(),
    language: z.literal("ko"),
    domain: z.literal("travel-reservation-inquiry"),
    source: z.literal("synthetic"),
    containsPersonalData: z.literal(false),
    cases: z.number().int().positive(),
    sha256: ReservationChallengeSha256Schema
  }).readonly(),
  evaluator: z.strictObject({
    id: z.literal(RESERVATION_CHALLENGE_EVALUATOR.id),
    version: z.literal(RESERVATION_CHALLENGE_EVALUATOR.version)
  }).readonly(),
  summary: ReservationChallengeSummarySchema,
  knownFailures: z.array(BaselineFailureSchema).readonly()
}).superRefine((baseline, context) => {
  const seenIds = new Set<string>();
  baseline.knownFailures.forEach((failure, index) => {
    if (seenIds.has(failure.id)) {
      context.addIssue({
        code: "custom",
        path: ["knownFailures", index, "id"],
        message: "Known failure IDs must be unique"
      });
    }
    seenIds.add(failure.id);
  });
}).readonly();

export type ReservationChallengeBaseline = z.infer<
  typeof ReservationChallengeBaselineSchema
>;

export type ReservationChallengeGate = {
  readonly passed: boolean;
  readonly knownFailures: number;
  readonly regressions: readonly string[];
};

export function createReservationChallengeBaseline(
  report: ReservationChallengeReport
): ReservationChallengeBaseline {
  return {
    schemaVersion: 2,
    dataset: report.dataset,
    evaluator: report.evaluator,
    summary: report.summary,
    knownFailures: report.failures
  };
}

export function verifyReservationChallengeBaseline(
  report: ReservationChallengeReport,
  input: unknown
): ReservationChallengeGate {
  const baseline = ReservationChallengeBaselineSchema.parse(input);
  const regressions: string[] = [];
  if (JSON.stringify(report.dataset) !== JSON.stringify(baseline.dataset)) {
    regressions.push("dataset_identity");
  }
  if (JSON.stringify(report.evaluator) !== JSON.stringify(baseline.evaluator)) {
    regressions.push("evaluator_identity");
  }
  compareSummary(report.summary, baseline.summary, regressions);

  const knownFailures = report.failures.filter((failure) => {
    const known = baseline.knownFailures.find((entry) => (
      entry.id === failure.id && entry.category === failure.category
    ));
    if (known === undefined || failure.reasons.some(
      (reason) => !known.reasons.includes(reason)
    )) {
      regressions.push(`unexpected_failure:${failure.id}`);
      return false;
    }
    return true;
  }).length;
  return {
    passed: regressions.length === 0,
    knownFailures,
    regressions: [...new Set(regressions)].sort()
  };
}

function compareSummary(
  current: ReservationChallengeReport["summary"],
  baseline: ReservationChallengeReport["summary"],
  regressions: string[]
): void {
  if (current.cases !== baseline.cases) regressions.push("case_count");
  if (current.validOutputs < baseline.validOutputs) regressions.push("valid_outputs");
  checkHigher(current.caseExact, baseline.caseExact, "case_exact", regressions);
  compareFields(current.fields, baseline.fields, "fields", regressions);
  checkHigher(
    current.abstention.precision,
    baseline.abstention.precision,
    "abstention_precision",
    regressions
  );
  checkHigher(
    current.abstention.recall,
    baseline.abstention.recall,
    "abstention_recall",
    regressions
  );
  compareRoute(current.route, baseline.route, "route", regressions);
  checkHigher(
    current.confirmationSetExact,
    baseline.confirmationSetExact,
    "confirmation_set_exact",
    regressions
  );
  if (current.invalidOutputs > baseline.invalidOutputs) regressions.push("invalid_outputs");
  if (current.extractorErrors > baseline.extractorErrors) regressions.push("extractor_errors");
  for (const [category, expected] of Object.entries(baseline.byCategory)) {
    const actual = current.byCategory[category];
    if (actual === undefined) {
      regressions.push(`category_missing:${category}`);
      continue;
    }
    checkHigher(actual.caseExact, expected.caseExact, `category:${category}:case_exact`, regressions);
    compareAggregate(actual.fields, expected.fields, `category:${category}:fields`, regressions);
    checkHigher(
      actual.abstention.precision,
      expected.abstention.precision,
      `category:${category}:abstention_precision`,
      regressions
    );
    checkHigher(
      actual.abstention.recall,
      expected.abstention.recall,
      `category:${category}:abstention_recall`,
      regressions
    );
    compareRoute(actual.route, expected.route, `category:${category}:route`, regressions);
    checkHigher(
      actual.confirmationSetExact,
      expected.confirmationSetExact,
      `category:${category}:confirmation_set`,
      regressions
    );
    if (actual.invalidOutputs > expected.invalidOutputs) {
      regressions.push(`category:${category}:invalid_outputs`);
    }
    if (actual.extractorErrors > expected.extractorErrors) {
      regressions.push(`category:${category}:extractor_errors`);
    }
  }
}

function compareRoute(
  current: ReservationChallengeReport["summary"]["route"],
  baseline: ReservationChallengeReport["summary"]["route"],
  prefix: string,
  regressions: string[]
): void {
  checkHigher(current.accuracy, baseline.accuracy, `${prefix}:accuracy`, regressions);
  const currentConfusion = current.confusion;
  const baselineConfusion = baseline.confusion;
  if (currentConfusion.expectedCreated.actualCreated
    < baselineConfusion.expectedCreated.actualCreated) {
    regressions.push(`${prefix}:expected_created:actual_created`);
  }
  if (currentConfusion.expectedCreated.actualNeedsConfirmation
    > baselineConfusion.expectedCreated.actualNeedsConfirmation) {
    regressions.push(`${prefix}:expected_created:actual_needs_confirmation`);
  }
  if (currentConfusion.expectedNeedsConfirmation.actualCreated
    > baselineConfusion.expectedNeedsConfirmation.actualCreated) {
    regressions.push(`${prefix}:expected_needs_confirmation:actual_created`);
  }
  if (currentConfusion.expectedNeedsConfirmation.actualNeedsConfirmation
    < baselineConfusion.expectedNeedsConfirmation.actualNeedsConfirmation) {
    regressions.push(`${prefix}:expected_needs_confirmation:actual_needs_confirmation`);
  }
}

function compareFields(
  current: ReservationChallengeReport["summary"]["fields"],
  baseline: ReservationChallengeReport["summary"]["fields"],
  prefix: string,
  regressions: string[]
): void {
  compareAggregate(current.aggregate, baseline.aggregate, `${prefix}:aggregate`, regressions);
  for (const field of ["destination", "startDate", "travelers", "productName"] as const) {
    compareAggregate(current.byField[field], baseline.byField[field], `${prefix}:${field}`, regressions);
  }
}

function compareAggregate(
  current: ReservationChallengeReport["summary"]["fields"]["aggregate"],
  baseline: ReservationChallengeReport["summary"]["fields"]["aggregate"],
  prefix: string,
  regressions: string[]
): void {
  checkHigher(current.exact, baseline.exact, `${prefix}:exact`, regressions);
  checkLower(current.falsePositive, baseline.falsePositive, `${prefix}:false_positive`, regressions);
  checkLower(current.falseNegative, baseline.falseNegative, `${prefix}:false_negative`, regressions);
}

function checkHigher(
  current: ProportionMetric,
  baseline: ProportionMetric,
  code: string,
  regressions: string[]
): void {
  if (baseline.denominator > 0 && (
    (current.denominator === 0 && baseline.numerator > 0)
    || current.numerator * baseline.denominator
      < baseline.numerator * current.denominator
  )) regressions.push(code);
}

function checkLower(
  current: ProportionMetric,
  baseline: ProportionMetric,
  code: string,
  regressions: string[]
): void {
  if (baseline.denominator === 0) {
    if (current.numerator > 0) regressions.push(code);
    return;
  }
  if (current.denominator > 0 && current.numerator * baseline.denominator
    > baseline.numerator * current.denominator) regressions.push(code);
}
