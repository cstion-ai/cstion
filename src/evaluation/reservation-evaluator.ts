import {
  REQUIRED_RESERVATION_FIELDS,
  ReservationEvaluationDatasetSchema,
  type RequiredReservationField,
  type ReservationEvaluationMessage
} from "./reservation-evaluation-schema.js";
import {
  ReservationDraftSchema,
  type ReservationDraft
} from "../shared/schemas.js";

export type ReservationExtractor = (
  message: ReservationEvaluationMessage
) => unknown | Promise<unknown>;

type FailureReason =
  | RequiredReservationField
  | "issues"
  | "invalid_output"
  | "extractor_error";

type AccuracyMetric = {
  matches: number;
  total: number;
  accuracy: number;
};

type EvaluationReport = {
  dataset: {
    name: string;
    schemaVersion: 1;
    createdAt: string;
    languages: string[];
    domain: "travel-reservation-inquiry";
    source: "synthetic";
    containsPersonalData: false;
    cases: number;
  };
  summary: {
    cases: {
      passed: number;
      total: number;
      accuracy: number;
    };
    requiredFields: {
      exactMatches: number;
      total: number;
      accuracy: number;
      byField: Record<RequiredReservationField, AccuracyMetric>;
    };
    requiredFieldFalsePositives: number;
    abstentions: {
      correct: number;
      total: number;
    };
    confirmationRouting: AccuracyMetric;
    invalidOutputs: number;
    extractorErrors: number;
  };
  failures: Array<{
    id: string;
    reasons: FailureReason[];
  }>;
};

export async function evaluateReservationExtractor(
  input: unknown,
  extractor: ReservationExtractor
): Promise<EvaluationReport> {
  const dataset = ReservationEvaluationDatasetSchema.parse(input);
  const fieldMatches: Record<RequiredReservationField, number> = {
    destination: 0,
    startDate: 0,
    travelers: 0,
    productName: 0
  };
  const failures: EvaluationReport["failures"] = [];
  let passedCases = 0;
  let exactMatches = 0;
  let falsePositives = 0;
  let abstentions = 0;
  let correctAbstentions = 0;
  let confirmationMatches = 0;
  let invalidOutputs = 0;
  let extractorErrors = 0;

  for (const evaluationCase of dataset.cases) {
    let rawOutput: unknown;
    try {
      rawOutput = await extractor(evaluationCase.input);
    } catch {
      extractorErrors += 1;
      failures.push({ id: evaluationCase.id, reasons: ["extractor_error"] });
      continue;
    }

    const output = ReservationDraftSchema.safeParse(rawOutput);
    if (!output.success) {
      invalidOutputs += 1;
      failures.push({ id: evaluationCase.id, reasons: ["invalid_output"] });
      continue;
    }

    const reasons: FailureReason[] = [];
    for (const field of REQUIRED_RESERVATION_FIELDS) {
      const actualValue = normalizeValue(output.data, field);
      const expectedValue = evaluationCase.expected[field];
      if (actualValue === null) {
        abstentions += 1;
        if (expectedValue === null) correctAbstentions += 1;
      } else if (expectedValue === null) {
        falsePositives += 1;
      }

      if (actualValue === expectedValue) {
        exactMatches += 1;
        fieldMatches[field] += 1;
      } else {
        reasons.push(field);
      }
    }

    if (sameIssues(output.data.issues, evaluationCase.expected.issues)) {
      confirmationMatches += 1;
    } else {
      reasons.push("issues");
    }

    if (reasons.length === 0) {
      passedCases += 1;
    } else {
      failures.push({ id: evaluationCase.id, reasons });
    }
  }

  const caseTotal = dataset.cases.length;
  const fieldTotal = caseTotal * REQUIRED_RESERVATION_FIELDS.length;
  return {
    dataset: {
      name: dataset.name,
      schemaVersion: dataset.schemaVersion,
      createdAt: dataset.createdAt,
      languages: dataset.languages,
      domain: dataset.domain,
      source: dataset.provenance.source,
      containsPersonalData: dataset.provenance.containsPersonalData,
      cases: caseTotal
    },
    summary: {
      cases: {
        passed: passedCases,
        total: caseTotal,
        accuracy: rate(passedCases, caseTotal)
      },
      requiredFields: {
        exactMatches,
        total: fieldTotal,
        accuracy: rate(exactMatches, fieldTotal),
        byField: {
          destination: accuracyMetric(fieldMatches.destination, caseTotal),
          startDate: accuracyMetric(fieldMatches.startDate, caseTotal),
          travelers: accuracyMetric(fieldMatches.travelers, caseTotal),
          productName: accuracyMetric(fieldMatches.productName, caseTotal)
        }
      },
      requiredFieldFalsePositives: falsePositives,
      abstentions: {
        correct: correctAbstentions,
        total: abstentions
      },
      confirmationRouting: accuracyMetric(confirmationMatches, caseTotal),
      invalidOutputs,
      extractorErrors
    },
    failures
  };
}

function normalizeValue(
  draft: ReservationDraft,
  field: RequiredReservationField
): string | number | null {
  return draft[field] ?? null;
}

function sameIssues(actual: string[], expected: RequiredReservationField[]): boolean {
  const sortedActual = [...actual].sort();
  const sortedExpected = [...expected].sort();
  return sortedActual.length === sortedExpected.length
    && sortedActual.every((issue, index) => issue === sortedExpected[index]);
}

function accuracyMetric(matches: number, total: number): AccuracyMetric {
  return { matches, total, accuracy: rate(matches, total) };
}

function rate(matches: number, total: number): number {
  return Number((matches / total).toFixed(4));
}
