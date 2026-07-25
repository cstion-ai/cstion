import type { BookingRecord } from "../booking/reservation-service.js";
import type { ErrorClassification } from "../platform/retry.js";
import type { ChannelMessage, CrmCustomer, CustomerIdentity } from "../shared/schemas.js";

export type IdempotencyDecision =
  | { readonly status: "started"; readonly key: string; readonly leaseToken: string }
  | { readonly status: "duplicate"; readonly key: string };

export type IdempotencyRepository = {
  begin(message: Pick<ChannelMessage, "channel" | "providerEventId">): Promise<IdempotencyDecision>;
  complete(key: string, leaseToken: string): Promise<void>;
  fail(key: string, leaseToken: string, classification: ErrorClassification): Promise<void>;
};

export type CustomerUpsertInput = {
  readonly name: string;
  readonly sourceChannel: CrmCustomer["sourceChannel"];
  readonly identities: CustomerIdentity[];
  readonly tags: string[];
};

export type CustomerRepository = {
  upsertByIdentities(input: CustomerUpsertInput): Promise<CrmCustomer>;
};

export type BookingRepository = {
  createLead(record: BookingRecord): Promise<BookingRecord>;
  count(): Promise<number>;
};

export class CustomerIdentityConflictError extends Error {
  readonly name = "CustomerIdentityConflictError";

  constructor(readonly customerIds: readonly string[]) {
    super(`Identities belong to multiple customers: ${customerIds.join(", ")}`);
  }
}

export class IdempotencyLeaseLostError extends Error {
  readonly name = "IdempotencyLeaseLostError";

  constructor(readonly idempotencyKey: string) {
    super(`Idempotency processing lease was lost: ${idempotencyKey}`);
  }
}
