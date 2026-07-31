import { z } from "zod";

const WilsonIntervalSchema = z.strictObject({
  low: z.number().min(0).max(1),
  high: z.number().min(0).max(1)
}).readonly();

export const ProportionMetricSchema = z.strictObject({
  numerator: z.number().int().nonnegative(),
  denominator: z.number().int().nonnegative(),
  rate: z.number().min(0).max(1).nullable(),
  wilson95: WilsonIntervalSchema.nullable()
}).superRefine((metric, context) => {
  if (metric.numerator > metric.denominator) {
    context.addIssue({
      code: "custom",
      path: ["numerator"],
      message: "Metric numerator must not exceed its denominator"
    });
  }
  if (metric.denominator === 0) {
    if (metric.numerator !== 0 || metric.rate !== null || metric.wilson95 !== null) {
      context.addIssue({
        code: "custom",
        message: "A zero-denominator metric must contain no observations or interval"
      });
    }
    return;
  }
  if (metric.rate === null || metric.wilson95 === null) {
    context.addIssue({
      code: "custom",
      message: "A measured proportion must include its rate and Wilson interval"
    });
    return;
  }
  if (metric.rate !== round(metric.numerator / metric.denominator)) {
    context.addIssue({
      code: "custom",
      path: ["rate"],
      message: "Metric rate must match its numerator and denominator"
    });
  }
  if (metric.wilson95.low > metric.rate || metric.wilson95.high < metric.rate) {
    context.addIssue({
      code: "custom",
      path: ["wilson95"],
      message: "Wilson interval must contain the reported rate"
    });
  }
}).readonly();

export type ProportionMetric = z.infer<typeof ProportionMetricSchema>;

const FieldMetricSchema = z.strictObject({
  exact: ProportionMetricSchema,
  falsePositive: ProportionMetricSchema,
  falseNegative: ProportionMetricSchema
}).readonly();

export type ReservationChallengeFieldMetric = z.infer<
  typeof FieldMetricSchema
>;

const AggregateFieldMetricsSchema = z.strictObject({
  exact: ProportionMetricSchema,
  falsePositive: ProportionMetricSchema,
  falseNegative: ProportionMetricSchema
}).readonly();

const FieldMetricsSchema = z.strictObject({
  aggregate: AggregateFieldMetricsSchema,
  byField: z.strictObject({
    destination: FieldMetricSchema,
    startDate: FieldMetricSchema,
    travelers: FieldMetricSchema,
    productName: FieldMetricSchema
  }).readonly()
}).readonly();

const AbstentionMetricsSchema = z.strictObject({
  precision: ProportionMetricSchema,
  recall: ProportionMetricSchema
}).readonly();

const RouteMetricsSchema = z.strictObject({
  confusion: z.strictObject({
    expectedCreated: z.strictObject({
      actualCreated: z.number().int().nonnegative(),
      actualNeedsConfirmation: z.number().int().nonnegative()
    }).readonly(),
    expectedNeedsConfirmation: z.strictObject({
      actualCreated: z.number().int().nonnegative(),
      actualNeedsConfirmation: z.number().int().nonnegative()
    }).readonly()
  }).readonly(),
  accuracy: ProportionMetricSchema
}).readonly();

const CategorySummarySchema = z.strictObject({
  cases: z.number().int().positive(),
  validOutputs: z.number().int().nonnegative(),
  caseExact: ProportionMetricSchema,
  fields: AggregateFieldMetricsSchema,
  abstention: AbstentionMetricsSchema,
  route: RouteMetricsSchema,
  confirmationSetExact: ProportionMetricSchema,
  invalidOutputs: z.number().int().nonnegative(),
  extractorErrors: z.number().int().nonnegative()
}).readonly();

export const ReservationChallengeSummarySchema = z.strictObject({
  cases: z.number().int().positive(),
  validOutputs: z.number().int().nonnegative(),
  caseExact: ProportionMetricSchema,
  fields: FieldMetricsSchema,
  abstention: AbstentionMetricsSchema,
  route: RouteMetricsSchema,
  confirmationSetExact: ProportionMetricSchema,
  invalidOutputs: z.number().int().nonnegative(),
  extractorErrors: z.number().int().nonnegative(),
  byCategory: z.record(
    z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    CategorySummarySchema
  ).readonly()
}).readonly();

export type ReservationChallengeSummary = z.infer<
  typeof ReservationChallengeSummarySchema
>;

export const ReservationChallengeFailureReasonSchema = z.enum([
  "destination",
  "startDate",
  "travelers",
  "productName",
  "route",
  "confirmation_fields",
  "invalid_output",
  "extractor_error"
]);

export type ReservationChallengeFailureReason = z.infer<
  typeof ReservationChallengeFailureReasonSchema
>;

const ChallengeFailureSchema = z.strictObject({
  id: z.string().min(1).max(100),
  category: z.string().min(1).max(80),
  reasons: z.array(ReservationChallengeFailureReasonSchema).min(1).readonly()
}).readonly();

export const RESERVATION_CHALLENGE_EVALUATOR = {
  id: "cstion-deterministic-kakao-parser",
  version: "1"
} as const;

export const ReservationChallengeSha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

export type ReservationChallengeReport = {
  readonly dataset: {
    readonly name: string;
    readonly schemaVersion: 2;
    readonly createdAt: string;
    readonly language: "ko";
    readonly domain: "travel-reservation-inquiry";
    readonly source: "synthetic";
    readonly containsPersonalData: false;
    readonly cases: number;
    readonly sha256: string;
  };
  readonly evaluator: typeof RESERVATION_CHALLENGE_EVALUATOR;
  readonly summary: ReservationChallengeSummary;
  readonly failures: readonly z.infer<typeof ChallengeFailureSchema>[];
};

export function proportionMetric(
  numerator: number,
  denominator: number
): ProportionMetric {
  if (denominator === 0) {
    return { numerator, denominator, rate: null, wilson95: null };
  }

  const rate = numerator / denominator;
  const zScore = 1.959963984540054;
  const squaredZ = zScore * zScore;
  const adjustment = 1 + squaredZ / denominator;
  const center = (rate + squaredZ / (2 * denominator)) / adjustment;
  const margin = zScore * Math.sqrt(
    (rate * (1 - rate) + squaredZ / (4 * denominator)) / denominator
  ) / adjustment;
  return {
    numerator,
    denominator,
    rate: round(rate),
    wilson95: {
      low: round(Math.max(0, center - margin)),
      high: round(Math.min(1, center + margin))
    }
  };
}

function round(value: number): number {
  return Number(value.toFixed(4));
}
