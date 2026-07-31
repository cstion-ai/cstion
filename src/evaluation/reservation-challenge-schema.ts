import { z } from "zod";
import { KakaoMessageSchema } from "../kakao/reservation-parser.js";

const ReservationChallengeFieldSchema = z.enum([
  "destination",
  "startDate",
  "travelers",
  "productName"
]);

export type ReservationChallengeField = z.infer<
  typeof ReservationChallengeFieldSchema
>;

export const RESERVATION_CHALLENGE_FIELDS = [
  "destination",
  "startDate",
  "travelers",
  "productName"
] as const satisfies readonly ReservationChallengeField[];

const ChallengeMessageSchema = KakaoMessageSchema
  .omit({ profile: true, text: true })
  .extend({ text: z.string().min(1).max(4_000) })
  .strict()
  .readonly();

export type ReservationChallengeMessage = z.infer<
  typeof ChallengeMessageSchema
>;

const ExpectedFieldsSchema = z.strictObject({
  destination: z.string().min(1).nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  travelers: z.number().int().positive().nullable(),
  productName: z.string().min(1).nullable()
}).readonly();

const ExpectedResultSchema = z.strictObject({
  fields: ExpectedFieldsSchema,
  route: z.enum(["created", "needs_confirmation"]),
  confirmationFields: z.array(ReservationChallengeFieldSchema)
    .max(RESERVATION_CHALLENGE_FIELDS.length)
    .readonly()
}).superRefine((expected, context) => {
  const confirmationFields = new Set(expected.confirmationFields);
  if (confirmationFields.size !== expected.confirmationFields.length) {
    context.addIssue({
      code: "custom",
      path: ["confirmationFields"],
      message: "Confirmation fields must not contain duplicates"
    });
  }

  for (const field of RESERVATION_CHALLENGE_FIELDS) {
    if (expected.fields[field] === null && !confirmationFields.has(field)) {
      context.addIssue({
        code: "custom",
        path: ["confirmationFields"],
        message: `Null field ${field} must require confirmation`
      });
    }
  }

  const derivedRoute = confirmationFields.size === 0
    ? "created"
    : "needs_confirmation";
  if (expected.route !== derivedRoute) {
    context.addIssue({
      code: "custom",
      path: ["route"],
      message: "Expected route must match confirmation fields"
    });
  }
}).readonly();

const FeatureSchema = z.string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(80);

const ChallengeCaseSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  category: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  language: z.literal("ko"),
  features: z.array(FeatureSchema).max(20).readonly().optional(),
  input: ChallengeMessageSchema,
  expected: ExpectedResultSchema
}).superRefine((challengeCase, context) => {
  if (challengeCase.features !== undefined
    && new Set(challengeCase.features).size !== challengeCase.features.length) {
    context.addIssue({
      code: "custom",
      path: ["features"],
      message: "Features must not contain duplicates"
    });
  }
}).readonly();

export const ReservationChallengeDatasetSchema = z.strictObject({
  schemaVersion: z.literal(2),
  kind: z.literal("challenge"),
  name: z.string().min(1).max(100),
  createdAt: z.string().date(),
  languages: z.tuple([z.literal("ko")]).readonly(),
  domain: z.literal("travel-reservation-inquiry"),
  labelPolicy: z.literal("reservation-fields-v1"),
  provenance: z.strictObject({
    source: z.literal("synthetic"),
    containsPersonalData: z.literal(false),
    description: z.string().min(1).max(500)
  }).readonly(),
  cases: z.array(ChallengeCaseSchema).min(1).max(10_000).readonly()
}).superRefine((dataset, context) => {
  const seenIds = new Set<string>();
  dataset.cases.forEach((challengeCase, index) => {
    if (seenIds.has(challengeCase.id)) {
      context.addIssue({
        code: "custom",
        path: ["cases", index, "id"],
        message: "Challenge case IDs must be unique"
      });
    }
    seenIds.add(challengeCase.id);
  });
}).readonly();

export type ReservationChallengeDataset = z.infer<
  typeof ReservationChallengeDatasetSchema
>;

export type ReservationChallengeCase = ReservationChallengeDataset["cases"][number];
