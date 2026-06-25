import type { CrmCustomer, ReservationIntent } from "../shared/schemas.js";

export type CustomerRepository = {
  upsert(customer: Omit<CrmCustomer, "id">): Promise<CrmCustomer>;
};

export class InMemoryCustomerRepository implements CustomerRepository {
  private readonly customers = new Map<string, CrmCustomer>();

  async upsert(customer: Omit<CrmCustomer, "id">): Promise<CrmCustomer> {
    const key = customer.phone ?? customer.email ?? `${customer.sourceChannel}:${customer.channelCustomerId}`;
    const saved: CrmCustomer = { ...customer, id: key };
    this.customers.set(key, saved);
    return saved;
  }
}

export async function createCustomerFromReservation(
  reservation: ReservationIntent,
  repository: CustomerRepository
): Promise<CrmCustomer> {
  return repository.upsert({
    name: reservation.customerName,
    sourceChannel: reservation.channel,
    channelCustomerId: reservation.channelCustomerId,
    ...(reservation.phone ? { phone: reservation.phone } : {}),
    ...(reservation.email ? { email: reservation.email } : {}),
    tags: ["travel-lead", reservation.destination, reservation.channel]
  });
}
