import { randomUUID } from "node:crypto";

import type { CrmCustomer, ReservationIntent } from "../shared/schemas.js";

export type BookingRecord = {
  id: string;
  customerId: string;
  destination: string;
  startDate: string;
  endDate?: string;
  travelers: number;
  status: "lead" | "quoted" | "confirmed" | "cancelled";
  productName?: string;
  memo?: string;
};

export function createBookingLead(customer: CrmCustomer, reservation: ReservationIntent): BookingRecord {
  return {
    id: `lead_${randomUUID()}`,
    customerId: customer.id,
    destination: reservation.destination,
    startDate: reservation.startDate,
    travelers: reservation.travelers,
    status: "lead",
    ...(reservation.endDate ? { endDate: reservation.endDate } : {}),
    ...(reservation.productName ? { productName: reservation.productName } : {}),
    ...(reservation.memo ? { memo: reservation.memo } : {})
  };
}
