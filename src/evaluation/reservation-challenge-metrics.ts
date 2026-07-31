import {
  RESERVATION_CHALLENGE_FIELDS,
  type ReservationChallengeField
} from "./reservation-challenge-schema.js";
import {
  proportionMetric,
  type ReservationChallengeFailureReason,
  type ReservationChallengeFieldMetric,
  type ReservationChallengeSummary
} from "./reservation-challenge-report.js";

type ChallengeRoute = "created" | "needs_confirmation";

export type ValidChallengeOutcome = {
  readonly kind: "valid";
  readonly id: string;
  readonly category: string;
  readonly fieldMatches: Readonly<Record<ReservationChallengeField, boolean>>;
  readonly expectedMissing: readonly ReservationChallengeField[];
  readonly actualMissing: readonly string[];
  readonly expectedRoute: ChallengeRoute;
  readonly actualRoute: ChallengeRoute;
  readonly confirmationSetExact: boolean;
  readonly reasons: readonly ReservationChallengeFailureReason[];
};

type FailedChallengeOutcome = {
  readonly kind: "invalid_output" | "extractor_error";
  readonly id: string;
  readonly category: string;
};

export type ChallengeOutcome = ValidChallengeOutcome | FailedChallengeOutcome;

export function summarizeChallengeOutcomes(
  outcomes: readonly ChallengeOutcome[],
  categories: readonly string[]
): ReservationChallengeSummary {
  const valid = outcomes.filter(isValidOutcome);
  const byField = {
    destination: fieldMetric(valid, "destination"),
    startDate: fieldMetric(valid, "startDate"),
    travelers: fieldMetric(valid, "travelers"),
    productName: fieldMetric(valid, "productName")
  };
  const fieldAggregate = aggregateFields(byField);
  return {
    cases: outcomes.length,
    validOutputs: valid.length,
    caseExact: proportionMetric(
      valid.filter((outcome) => outcome.reasons.length === 0).length,
      valid.length
    ),
    fields: { aggregate: fieldAggregate, byField },
    abstention: abstentionMetrics(valid),
    route: routeMetrics(valid),
    confirmationSetExact: proportionMetric(
      valid.filter((outcome) => outcome.confirmationSetExact).length,
      valid.length
    ),
    invalidOutputs: outcomes.filter((outcome) => outcome.kind === "invalid_output").length,
    extractorErrors: outcomes.filter((outcome) => outcome.kind === "extractor_error").length,
    byCategory: Object.fromEntries(categories.map((category) => {
      const categoryOutcomes = outcomes.filter((outcome) => outcome.category === category);
      const categoryValid = categoryOutcomes.filter(isValidOutcome);
      const categoryFields = RESERVATION_CHALLENGE_FIELDS.map((field) => (
        fieldMetric(categoryValid, field)
      ));
      return [category, {
        cases: categoryOutcomes.length,
        validOutputs: categoryValid.length,
        caseExact: proportionMetric(
          categoryValid.filter((outcome) => outcome.reasons.length === 0).length,
          categoryValid.length
        ),
        fields: aggregateFieldList(categoryFields),
        abstention: abstentionMetrics(categoryValid),
        route: routeMetrics(categoryValid),
        confirmationSetExact: proportionMetric(
          categoryValid.filter((outcome) => outcome.confirmationSetExact).length,
          categoryValid.length
        ),
        invalidOutputs: categoryOutcomes.filter(
          (outcome) => outcome.kind === "invalid_output"
        ).length,
        extractorErrors: categoryOutcomes.filter(
          (outcome) => outcome.kind === "extractor_error"
        ).length
      }];
    }))
  };
}

function fieldMetric(
  outcomes: readonly ValidChallengeOutcome[],
  field: ReservationChallengeField
): ReservationChallengeFieldMetric {
  const expectedMissing = outcomes.filter((outcome) => (
    outcome.expectedMissing.includes(field)
  ));
  const expectedPresent = outcomes.filter((outcome) => (
    !outcome.expectedMissing.includes(field)
  ));
  return {
    exact: proportionMetric(
      outcomes.filter((outcome) => outcome.fieldMatches[field]).length,
      outcomes.length
    ),
    falsePositive: proportionMetric(
      expectedMissing.filter((outcome) => !outcome.actualMissing.includes(field)).length,
      expectedMissing.length
    ),
    falseNegative: proportionMetric(
      expectedPresent.filter((outcome) => outcome.actualMissing.includes(field)).length,
      expectedPresent.length
    )
  };
}

function aggregateFields(
  fields: Readonly<Record<ReservationChallengeField, ReservationChallengeFieldMetric>>
): ReservationChallengeSummary["fields"]["aggregate"] {
  return aggregateFieldList(RESERVATION_CHALLENGE_FIELDS.map((field) => fields[field]));
}

function aggregateFieldList(
  fields: readonly ReservationChallengeFieldMetric[]
): ReservationChallengeSummary["fields"]["aggregate"] {
  return {
    exact: proportionMetric(
      sum(fields.map((field) => field.exact.numerator)),
      sum(fields.map((field) => field.exact.denominator))
    ),
    falsePositive: proportionMetric(
      sum(fields.map((field) => field.falsePositive.numerator)),
      sum(fields.map((field) => field.falsePositive.denominator))
    ),
    falseNegative: proportionMetric(
      sum(fields.map((field) => field.falseNegative.numerator)),
      sum(fields.map((field) => field.falseNegative.denominator))
    )
  };
}

function abstentionMetrics(
  outcomes: readonly ValidChallengeOutcome[]
): ReservationChallengeSummary["abstention"] {
  const correct = sum(outcomes.map((outcome) => RESERVATION_CHALLENGE_FIELDS.filter(
    (field) => outcome.expectedMissing.includes(field)
      && outcome.actualMissing.includes(field)
  ).length));
  const predicted = sum(outcomes.map((outcome) => RESERVATION_CHALLENGE_FIELDS.filter(
    (field) => outcome.actualMissing.includes(field)
  ).length));
  const expected = sum(outcomes.map((outcome) => outcome.expectedMissing.length));
  return {
    precision: proportionMetric(correct, predicted),
    recall: proportionMetric(correct, expected)
  };
}

function routeMetrics(
  outcomes: readonly ValidChallengeOutcome[]
): ReservationChallengeSummary["route"] {
  const expectedCreated = outcomes.filter((outcome) => outcome.expectedRoute === "created");
  const expectedConfirmation = outcomes.filter(
    (outcome) => outcome.expectedRoute === "needs_confirmation"
  );
  const actualCreated = (outcome: ValidChallengeOutcome): boolean => (
    outcome.actualRoute === "created"
  );
  const matches = outcomes.filter(
    (outcome) => outcome.actualRoute === outcome.expectedRoute
  ).length;
  return {
    confusion: {
      expectedCreated: {
        actualCreated: expectedCreated.filter(actualCreated).length,
        actualNeedsConfirmation: expectedCreated.filter(
          (outcome) => !actualCreated(outcome)
        ).length
      },
      expectedNeedsConfirmation: {
        actualCreated: expectedConfirmation.filter(actualCreated).length,
        actualNeedsConfirmation: expectedConfirmation.filter(
          (outcome) => !actualCreated(outcome)
        ).length
      }
    },
    accuracy: proportionMetric(matches, outcomes.length)
  };
}

function isValidOutcome(outcome: ChallengeOutcome): outcome is ValidChallengeOutcome {
  return outcome.kind === "valid";
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
