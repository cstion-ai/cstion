import { BookingRecord } from "../booking/reservation-service.js";
import { ChannelMessage, CrmCustomer, CustomerIdentity } from "../shared/schemas.js";

export type IdempotencyDecision =
  | { status: "started"; key: string }
  | { status: "duplicate"; key: string };

export type IdempotencyRepository = {
  begin(message: Pick<ChannelMessage, "channel" | "providerEventId">): Promise<IdempotencyDecision>;
  complete(key: string): Promise<void>;
  fail(key: string, reason: string): Promise<void>;
};

export type CustomerUpsertInput = {
  name: string;
  sourceChannel: CrmCustomer["sourceChannel"];
  identities: CustomerIdentity[];
  tags: string[];
};

export type CustomerRepository = {
  upsertByIdentities(input: CustomerUpsertInput): Promise<CrmCustomer>;
};

export type BookingRepository = {
  createLead(record: BookingRecord): Promise<BookingRecord>;
  count(): Promise<number>;
};
