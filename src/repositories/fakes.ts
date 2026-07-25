import { randomUUID } from "node:crypto";
import type { BookingRecord } from "../booking/reservation-service.js";
import type { ErrorClassification } from "../platform/retry.js";
import type { CrmCustomer, CustomerIdentity } from "../shared/schemas.js";
import {
  CustomerIdentityConflictError,
  IdempotencyLeaseLostError
} from "./interfaces.js";
import type {
  BookingRepository,
  CustomerRepository,
  CustomerUpsertInput,
  IdempotencyDecision,
  IdempotencyRepository
} from "./interfaces.js";

type FakeIdempotencyEvent = {
  readonly status: "processing" | "completed" | "failed";
  readonly leaseToken: string;
  readonly processingStartedAtMs: number;
};

export type FakeIdempotencyOptions = {
  readonly processingLeaseMs?: number;
  readonly now?: () => number;
};

export class FakePostgresIdempotencyRepository implements IdempotencyRepository {
  private readonly events = new Map<string, FakeIdempotencyEvent>();
  private readonly processingLeaseMs: number;
  private readonly now: () => number;
  readonly failureClassifications = new Map<string, ErrorClassification>();

  constructor(options: FakeIdempotencyOptions = {}) {
    this.processingLeaseMs = options.processingLeaseMs ?? 5 * 60 * 1_000;
    this.now = options.now ?? Date.now;
  }

  async begin(message: { channel: string; providerEventId: string }): Promise<IdempotencyDecision> {
    const key = `${message.channel}:${message.providerEventId}`;
    const existing = this.events.get(key);
    const processingIsActive = existing?.status === "processing"
      && this.now() - existing.processingStartedAtMs <= this.processingLeaseMs;
    if (existing?.status === "completed" || processingIsActive) {
      return { status: "duplicate", key };
    }

    const leaseToken = randomUUID();
    this.events.set(key, {
      status: "processing",
      leaseToken,
      processingStartedAtMs: this.now()
    });
    return { status: "started", key, leaseToken };
  }

  async complete(key: string, leaseToken: string): Promise<void> {
    const event = this.requireLease(key, leaseToken);
    this.events.set(key, { ...event, status: "completed" });
  }

  async fail(
    key: string,
    leaseToken: string,
    classification: ErrorClassification
  ): Promise<void> {
    const event = this.requireLease(key, leaseToken);
    this.events.set(key, { ...event, status: "failed" });
    this.failureClassifications.set(key, classification);
  }

  private requireLease(key: string, leaseToken: string): FakeIdempotencyEvent {
    const event = this.events.get(key);
    if (
      !event
      || event.status !== "processing"
      || event.leaseToken !== leaseToken
    ) {
      throw new IdempotencyLeaseLostError(key);
    }
    return event;
  }
}

export class FakeCustomerRepository implements CustomerRepository {
  private readonly customers = new Map<string, CrmCustomer>();
  private readonly identityIndex = new Map<string, string>();

  async upsertByIdentities(input: CustomerUpsertInput): Promise<CrmCustomer> {
    const ownerIds = new Set(
      input.identities
        .map(identityKey)
        .map((key) => this.identityIndex.get(key))
        .filter((id) => id !== undefined)
    );
    if (ownerIds.size > 1) {
      throw new CustomerIdentityConflictError([...ownerIds]);
    }

    const existingId = [...ownerIds][0];
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
    const existing = this.records.find((candidate) => candidate.id === record.id);
    if (existing) {
      return existing;
    }

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
