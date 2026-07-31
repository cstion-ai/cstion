import { z } from "zod";
import { KakaoMessageSchema } from "../kakao/reservation-parser.js";

const RequiredReservationFieldSchema = z.enum([
  "destination",
  "startDate",
  "travelers",
  "productName"
]);

export type RequiredReservationField = z.infer<
  typeof RequiredReservationFieldSchema
>;

export const REQUIRED_RESERVATION_FIELDS: readonly RequiredReservationField[] = [
  "destination",
  "startDate",
  "travelers",
  "productName"
];

const EvaluationMessageSchema = KakaoMessageSchema
  .omit({ profile: true, text: true })
  .extend({
    text: z.string().min(1).max(4_000)
  })
  .strict();

export type ReservationEvaluationMessage = z.infer<
  typeof EvaluationMessageSchema
>;

const ExpectedReservationSchema = z.strictObject({
  destination: z.string().min(1).nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  travelers: z.number().int().positive().nullable(),
  productName: z.string().min(1).nullable(),
  issues: z.array(RequiredReservationFieldSchema)
    .max(REQUIRED_RESERVATION_FIELDS.length)
}).superRefine((expected, context) => {
  const uniqueIssues = new Set(expected.issues);
  if (uniqueIssues.size !== expected.issues.length) {
    context.addIssue({
      code: "custom",
      path: ["issues"],
      message: "Expected issues must not contain duplicates"
    });
  }

  for (const field of REQUIRED_RESERVATION_FIELDS) {
    const isMissing = expected[field] === null;
    if (uniqueIssues.has(field) !== isMissing) {
      context.addIssue({
        code: "custom",
        path: ["issues"],
        message: `Expected issue ${field} must match its nullable field`
      });
    }
  }
});

export const ReservationEvaluationDatasetSchema = z.strictObject({
  schemaVersion: z.literal(1),
  name: z.string().min(1).max(100),
  createdAt: z.string().date(),
  languages: z.array(z.string().min(2).max(20)).min(1).max(20),
  domain: z.literal("travel-reservation-inquiry"),
  provenance: z.strictObject({
    source: z.literal("synthetic"),
    containsPersonalData: z.literal(false),
    description: z.string().min(1).max(500)
  }),
  cases: z.array(z.strictObject({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
    input: EvaluationMessageSchema,
    expected: ExpectedReservationSchema
  })).min(1).max(10_000)
}).superRefine((dataset, context) => {
  const seenIds = new Set<string>();
  dataset.cases.forEach((entry, index) => {
    if (seenIds.has(entry.id)) {
      context.addIssue({
        code: "custom",
        path: ["cases", index, "id"],
        message: "Evaluation case IDs must be unique"
      });
    }
    seenIds.add(entry.id);
  });
});

export type ReservationEvaluationDataset = z.infer<
  typeof ReservationEvaluationDatasetSchema
>;
