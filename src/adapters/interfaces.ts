import { BookingRecord } from "../booking/reservation-service.js";
import { CrmCustomer } from "../shared/schemas.js";
import { RetryPolicy } from "../platform/retry.js";

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
