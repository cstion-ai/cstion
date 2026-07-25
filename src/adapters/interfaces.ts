import type { BookingRecord } from "../booking/reservation-service.js";
import type { RetryPolicy } from "../platform/retry.js";
import type { CrmCustomer } from "../shared/schemas.js";

export type AdapterContext = {
  idempotencyKey: string;
  retryPolicy: RetryPolicy;
};

export type CrmAdapter = {
  syncCustomer(customer: CrmCustomer, context: AdapterContext): Promise<void>;
};

export type SheetsAdapter = {
  appendBookingLead(booking: BookingRecord, context: AdapterContext): Promise<void>;
};
