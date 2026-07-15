import { CrmCustomer, ReservationDraft, ReservationIntent, ReservationIntentSchema } from "../shared/schemas.js";
import { redactString } from "../platform/redaction.js";

export type BookingRecord = {
  id: string;
  customerId: string;
  destination: string;
  startDate: string;
  endDate?: string;
  travelers: number;
  productName: string;
  status: "lead" | "quoted" | "confirmed" | "cancelled";
  memo?: string;
};

export type BookingDecision =
  | { status: "created"; booking: BookingRecord; reservation: ReservationIntent }
  | { status: "needs_confirmation"; reservation: ReservationDraft; missingFields: string[] };

export function decideBookingLead(customer: CrmCustomer, draft: ReservationDraft): BookingDecision {
  const missingFields = findMissingFields(draft);
  if (missingFields.length > 0) {
    return { status: "needs_confirmation", reservation: draft, missingFields };
  }

  const reservation = ReservationIntentSchema.parse({ ...draft, issues: [] });
  return { status: "created", booking: createBookingLead(customer, reservation), reservation };
}

export function createBookingLead(customer: CrmCustomer, reservation: ReservationIntent): BookingRecord {
  return {
    id: `lead_${reservation.channel}_${reservation.providerEventId}`,
    customerId: customer.id,
    destination: reservation.destination,
    startDate: reservation.startDate,
    endDate: reservation.endDate,
    travelers: reservation.travelers,
    productName: reservation.productName,
    status: reservation.confidence >= 0.7 ? "lead" : "quoted",
    memo: reservation.memo ? redactString(reservation.memo) : undefined
  };
}

export function findMissingFields(draft: ReservationDraft): string[] {
  const missing = new Set<string>(draft.issues);
  if (!draft.startDate) missing.add("startDate");
  if (!draft.travelers) missing.add("travelers");
  if (!draft.productName) missing.add("productName");
  if (!draft.destination) missing.add("destination");
  if (draft.startDate && !isValidCalendarDate(draft.startDate)) missing.add("startDate");
  if (draft.endDate && !isValidCalendarDate(draft.endDate)) missing.add("endDate");
  return [...missing];
}

export function isValidCalendarDate(value: string): boolean {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
