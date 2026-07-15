import { BookingRecord } from "../booking/reservation-service.js";
import { CrmCustomer, CustomerIdentity } from "../shared/schemas.js";
import { BookingRepository, CustomerRepository, CustomerUpsertInput, IdempotencyDecision, IdempotencyRepository } from "./interfaces.js";

export type SqlClient = {
  query<T = unknown>(sql: string, values?: readonly unknown[]): Promise<{ rows: T[]; rowCount: number | null }>;
};

export class PostgresIdempotencyRepository implements IdempotencyRepository {
  constructor(private readonly client: SqlClient) {}

  async begin(message: { channel: string; providerEventId: string }): Promise<IdempotencyDecision> {
    const key = `${message.channel}:${message.providerEventId}`;
    const result = await this.client.query<{ inserted: boolean }>(
      `INSERT INTO channel_events (channel, provider_event_id)
       VALUES ($1, $2)
       ON CONFLICT (channel, provider_event_id) DO NOTHING
       RETURNING TRUE AS inserted`,
      [message.channel, message.providerEventId]
    );

    return result.rowCount === 1 ? { status: "started", key } : { status: "duplicate", key };
  }

  async complete(key: string): Promise<void> {
    const [channel, providerEventId] = splitKey(key);
    await this.client.query(
      `UPDATE channel_events SET status = 'completed', completed_at = now() WHERE channel = $1 AND provider_event_id = $2`,
      [channel, providerEventId]
    );
  }

  async fail(key: string, reason: string): Promise<void> {
    const [channel, providerEventId] = splitKey(key);
    await this.client.query(
      `UPDATE channel_events SET status = 'failed', error_classification = $3 WHERE channel = $1 AND provider_event_id = $2`,
      [channel, providerEventId, reason]
    );
  }
}

export class PostgresCustomerRepository implements CustomerRepository {
  constructor(private readonly client: SqlClient) {}

  async upsertByIdentities(input: CustomerUpsertInput): Promise<CrmCustomer> {
    const existing = await this.findByIdentities(input.identities);
    const customerId = existing?.id ?? (await this.insertCustomer(input));

    await this.client.query(`UPDATE customers SET name = $2, tags = $3, updated_at = now() WHERE id = $1`, [
      customerId,
      input.name,
      input.tags
    ]);

    for (const identity of input.identities) {
      await this.client.query(
        `INSERT INTO customer_identities (customer_id, identity_type, provider, identity_value)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (identity_type, provider, identity_value) DO NOTHING`,
        [customerId, identity.type, identity.provider ?? null, identity.value]
      );
    }

    return { id: customerId, name: input.name, sourceChannel: input.sourceChannel, identities: input.identities, tags: input.tags };
  }

  private async findByIdentities(identities: CustomerIdentity[]): Promise<{ id: string } | undefined> {
    for (const identity of identities) {
      const result = await this.client.query<{ id: string }>(
        `SELECT c.id
         FROM customers c
         JOIN customer_identities ci ON ci.customer_id = c.id
         WHERE ci.identity_type = $1 AND ci.provider IS NOT DISTINCT FROM $2 AND ci.identity_value = $3
         LIMIT 1`,
        [identity.type, identity.provider ?? null, identity.value]
      );
      if (result.rows[0]) return result.rows[0];
    }
    return undefined;
  }

  private async insertCustomer(input: CustomerUpsertInput): Promise<string> {
    const result = await this.client.query<{ id: string }>(
      `INSERT INTO customers (name, source_channel, tags) VALUES ($1, $2, $3) RETURNING id`,
      [input.name, input.sourceChannel, input.tags]
    );
    return result.rows[0].id;
  }
}

export class PostgresBookingRepository implements BookingRepository {
  constructor(private readonly client: SqlClient) {}

  async createLead(record: BookingRecord): Promise<BookingRecord> {
    await this.client.query(
      `INSERT INTO booking_leads (id, customer_id, destination, start_date, end_date, travelers, product_name, status, memo_redacted)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [record.id, record.customerId, record.destination, record.startDate, record.endDate ?? null, record.travelers, record.productName, record.status, record.memo]
    );
    return record;
  }

  async count(): Promise<number> {
    const result = await this.client.query<{ count: string }>(`SELECT COUNT(*) AS count FROM booking_leads`);
    return Number(result.rows[0]?.count ?? 0);
  }
}

function splitKey(key: string): [string, string] {
  const separator = key.indexOf(":");
  return [key.slice(0, separator), key.slice(separator + 1)];
}
