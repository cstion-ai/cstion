import type { CrmCustomer, CustomerIdentity, ReservationDraft } from "../shared/schemas.js";
import type { CustomerRepository } from "../repositories/interfaces.js";

export function buildCustomerIdentities(reservation: ReservationDraft): CustomerIdentity[] {
  const identities: CustomerIdentity[] = [
    { type: "channel", provider: reservation.channel, value: reservation.providerUserId }
  ];

  if (reservation.phone) identities.push({ type: "phone", value: reservation.phone });
  if (reservation.email) identities.push({ type: "email", value: reservation.email.toLowerCase() });

  return identities;
}

export async function createCustomerFromReservation(
  reservation: ReservationDraft,
  repository: CustomerRepository
): Promise<CrmCustomer> {
  return repository.upsertByIdentities({
    name: reservation.customerName,
    sourceChannel: reservation.channel,
    identities: buildCustomerIdentities(reservation),
    tags: ["travel-lead", reservation.destination ?? "destination-pending", reservation.channel]
  });
}
