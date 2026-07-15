import { randomUUID } from "node:crypto";
import { BookingRecord } from "../booking/reservation-service.js";
import { CrmCustomer, CustomerIdentity } from "../shared/schemas.js";
import { BookingRepository, CustomerRepository, CustomerUpsertInput, IdempotencyDecision, IdempotencyRepository } from "./interfaces.js";

export class FakePostgresIdempotencyRepository implements IdempotencyRepository {
  private readonly events = new Map<string, "processing" | "completed" | "failed">();

  async begin(message: { channel: string; providerEventId: string }): Promise<IdempotencyDecision> {
    const key = `${message.channel}:${message.providerEventId}`;
    if (this.events.has(key)) return { status: "duplicate", key };
    this.events.set(key, "processing");
    return { status: "started", key };
  }

  async complete(key: string): Promise<void> {
    this.events.set(key, "completed");
  }

  async fail(key: string): Promise<void> {
    this.events.set(key, "failed");
  }
}

export class FakeCustomerRepository implements CustomerRepository {
  private readonly customers = new Map<string, CrmCustomer>();
  private readonly identityIndex = new Map<string, string>();

  async upsertByIdentities(input: CustomerUpsertInput): Promise<CrmCustomer> {
    const existingId = input.identities.map(identityKey).map((key) => this.identityIndex.get(key)).find(Boolean);
    const id = existingId ?? randomUUID();
    const existing = this.customers.get(id);
    const mergedIdentities = mergeIdentities(existing?.identities ?? [], input.identities);
    const customer: CrmCustomer = {
      id,
      name: input.name,
      sourceChannel: input.sourceChannel,
      identities: mergedIdentities,
      tags: input.tags
    };

    this.customers.set(id, customer);
    for (const identity of mergedIdentities) {
      this.identityIndex.set(identityKey(identity), id);
    }

    return customer;
  }
}

export class FakeBookingRepository implements BookingRepository {
  readonly records: BookingRecord[] = [];

  async createLead(record: BookingRecord): Promise<BookingRecord> {
    this.records.push(record);
    return record;
  }

  async count(): Promise<number> {
    return this.records.length;
  }
}

function identityKey(identity: CustomerIdentity): string {
  return `${identity.type}:${identity.provider ?? ""}:${identity.value}`;
}

function mergeIdentities(current: CustomerIdentity[], incoming: CustomerIdentity[]): CustomerIdentity[] {
  const merged = new Map<string, CustomerIdentity>();
  for (const identity of [...current, ...incoming]) {
    merged.set(identityKey(identity), identity);
  }
  return [...merged.values()];
}
