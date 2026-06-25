import { CrmCustomer, ReservationIntent } from "../shared/schemas.js";

export type BookingRecord = {
  id: string;
  customerId: string;
  destination: string;
  startDate: string;
  endDate?: string;
  travelers: number;
  status: "lead" | "quoted" | "confirmed" | "cancelled";
  memo?: string;
};

export function createBookingLead(customer: CrmCustomer, reservation: ReservationIntent): BookingRecord {
  return {
    id: `lead_${Date.now()}`,
    customerId: customer.id,
    destination: reservation.destination,
    startDate: reservation.startDate,
    endDate: reservation.endDate,
    travelers: reservation.travelers,
    status: reservation.confidence >= 0.7 ? "lead" : "quoted",
    memo: reservation.memo
  };
}
