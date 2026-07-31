import { z } from "zod";
import { findMissingFields } from "../booking/reservation-service.js";
import { parseKakaoReservation } from "../kakao/reservation-parser.js";

const SyntheticMessageSchema = z.string().trim().min(1).max(4_000);

export type SandboxResult = {
  readonly destination: string | null;
  readonly startDate: string | null;
  readonly travelers: number | null;
  readonly productName: string | null;
  readonly route: "created" | "needs_confirmation";
  readonly missingFields: readonly string[];
  readonly confidence: number;
};

export class SandboxInputError extends Error {
  override readonly name = "SandboxInputError";

  constructor() {
    super("Enter a synthetic message between 1 and 4,000 characters.");
  }
}

export function evaluateSyntheticReservation(input: unknown): SandboxResult {
  const text = SyntheticMessageSchema.safeParse(input);
  if (!text.success) throw new SandboxInputError();

  const draft = parseKakaoReservation({
    providerEventId: "browser-sandbox-event",
    providerUserId: "browser-sandbox-user",
    text: text.data,
    receivedAt: "2026-07-31T00:00:00.000Z"
  });
  const missingFields = findMissingFields(draft);

  return {
    destination: draft.destination ?? null,
    startDate: draft.startDate ?? null,
    travelers: draft.travelers ?? null,
    productName: draft.productName ?? null,
    route: missingFields.length === 0 ? "created" : "needs_confirmation",
    missingFields,
    confidence: draft.confidence
  };
}
