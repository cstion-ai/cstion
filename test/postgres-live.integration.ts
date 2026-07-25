import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Client } from "pg";
import { z } from "zod";
import { PostgresDatabase } from "../src/repositories/postgres-database.js";
import {
  PostgresBookingRepository,
  PostgresCustomerRepository,
  PostgresIdempotencyRepository
} from "../src/repositories/postgres-repositories.js";
import {
  applyDatabaseMigrations,
  type DatabaseMigration,
  type MigrationClient
} from "../src/repositories/migrate.js";

const IntegrationEnvironmentSchema = z.object({
  DATABASE_URL: z.string().url()
});
const CountRowSchema = z.object({
  count: z.coerce.number().int().nonnegative()
});
const MigrationStateRowSchema = z.object({
  provider: z.literal(""),
  is_nullable: z.literal("NO"),
  migration_count: z.coerce.number().int().positive()
});
const SCHEMA_URL = new URL(
  "../src/repositories/postgres-schema.sql",
  import.meta.url
);
const MIGRATION_URL = new URL(
  "../src/repositories/migrations/001_harden_existing_schema.sql",
  import.meta.url
);

test("Given a legacy database, when the migration runs on PostgreSQL, then identities and event leases are hardened", async () => {
  const database = await createLiveSchema();
  try {
    await database.client.query(LEGACY_SCHEMA_SQL);
    const customer = await database.client.query<{ readonly id: string }>(
      `INSERT INTO customers (name, source_channel)
       VALUES ('Synthetic Traveler', 'kakao')
       RETURNING id`
    );
    const customerId = customer.rows[0]?.id;
    assert.ok(customerId);
    await database.client.query(
      `INSERT INTO customer_identities
         (customer_id, identity_type, provider, identity_value)
       VALUES
         ($1, 'phone', NULL, '+82-10-0000-0000'),
         ($1, 'phone', NULL, '+82-10-0000-0000')`,
      [customerId]
    );

    const migration: DatabaseMigration = {
      id: "001_harden_existing_schema.sql",
      sql: await readFile(MIGRATION_URL, "utf8")
    };
    const migrationClient: MigrationClient = {
      query: async (sql, values = []) => {
        const result = await database.client.query(sql, [...values]);
        return { rowCount: Array.isArray(result) ? null : result.rowCount };
      }
    };
    await applyDatabaseMigrations(migrationClient, [migration]);
    await applyDatabaseMigrations(migrationClient, [migration]);

    const state = await database.client.query(
      `SELECT
         ci.provider,
         columns.is_nullable,
         (SELECT COUNT(*) FROM schema_migrations) AS migration_count
       FROM customer_identities ci
       JOIN information_schema.columns AS columns
         ON columns.table_schema = current_schema()
        AND columns.table_name = 'customer_identities'
        AND columns.column_name = 'provider'`
    );
    assert.deepEqual(
      MigrationStateRowSchema.parse(state.rows[0]),
      { provider: "", is_nullable: "NO", migration_count: 1 }
    );

    const eventColumns = await database.client.query(
      `SELECT COUNT(*) AS count
       FROM information_schema.columns
       WHERE table_schema = current_schema()
         AND table_name = 'channel_events'
         AND column_name IN ('processing_started_at', 'processing_token', 'attempt_count')`
    );
    assert.equal(CountRowSchema.parse(eventColumns.rows[0]).count, 3);
  } finally {
    await database.close();
  }
});

test("Given concurrent writes, when repositories use PostgreSQL, then customer, event, and booking records stay idempotent", async () => {
  const database = await createLiveSchema();
  const pool = new PostgresDatabase({ connectionString: database.connectionString });
  try {
    await database.client.query(await readFile(SCHEMA_URL, "utf8"));
    const customers = new PostgresCustomerRepository(pool);
    const events = new PostgresIdempotencyRepository(pool);
    const bookings = new PostgresBookingRepository(pool);
    const customerInput = {
      name: "Synthetic Traveler",
      sourceChannel: "kakao" as const,
      identities: [{ type: "channel" as const, provider: "kakao", value: "synthetic-user" }],
      tags: ["integration"]
    };

    const customerResults = await Promise.all([
      customers.upsertByIdentities(customerInput),
      customers.upsertByIdentities(customerInput)
    ]);
    assert.equal(new Set(customerResults.map((customer) => customer.id)).size, 1);
    const customerId = customerResults[0]?.id;
    assert.ok(customerId);

    const eventResults = await Promise.all([
      events.begin({ channel: "kakao", providerEventId: "concurrent-event" }),
      events.begin({ channel: "kakao", providerEventId: "concurrent-event" })
    ]);
    assert.deepEqual(
      eventResults.map((result) => result.status).sort(),
      ["duplicate", "started"]
    );
    const startedEvent = eventResults.find(
      (result) => result.status === "started"
    );
    assert.ok(startedEvent);
    await events.complete(startedEvent.key, startedEvent.leaseToken);

    const failedEvent = await events.begin({
      channel: "kakao",
      providerEventId: "retry-event"
    });
    assert.equal(failedEvent.status, "started");
    if (failedEvent.status === "started") {
      await events.fail(failedEvent.key, failedEvent.leaseToken, "transient");
    }
    const restartedEvent = await events.begin({
      channel: "kakao",
      providerEventId: "retry-event"
    });
    assert.equal(restartedEvent.status, "started");

    const lead = {
      id: "lead_kakao_concurrent-event",
      customerId,
      destination: "Jeju",
      startDate: "2026-08-12",
      travelers: 2,
      productName: "Synthetic Package",
      status: "lead" as const
    };
    const bookingResults = await Promise.all([
      bookings.createLead(lead),
      bookings.createLead(lead)
    ]);
    assert.equal(new Set(bookingResults.map((booking) => booking.id)).size, 1);
    assert.equal(await bookings.count(), 1);

    const customerCount = await pool.query(
      "SELECT COUNT(*) AS count FROM customers"
    );
    assert.equal(CountRowSchema.parse(customerCount.rows[0]).count, 1);
  } finally {
    await pool.close();
    await database.close();
  }
});

type LiveSchema = {
  readonly connectionString: string;
  readonly client: Client;
  close(): Promise<void>;
};

async function createLiveSchema(): Promise<LiveSchema> {
  const { DATABASE_URL: baseConnectionString } =
    IntegrationEnvironmentSchema.parse(process.env);
  const admin = new Client({ connectionString: baseConnectionString });
  await admin.connect();
  const schema = `integration_${randomUUID().replaceAll("-", "")}`;
  await admin.query(`CREATE SCHEMA "${schema}"`);

  const isolatedUrl = new URL(baseConnectionString);
  isolatedUrl.searchParams.set("options", `-c search_path=${schema}`);
  const client = new Client({ connectionString: isolatedUrl.toString() });
  await client.connect();

  return {
    connectionString: isolatedUrl.toString(),
    client,
    close: async () => {
      await client.end();
      await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
      await admin.end();
    }
  };
}

const LEGACY_SCHEMA_SQL = `
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  CREATE TABLE channel_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL,
    provider_event_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    error_classification TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    UNIQUE (channel, provider_event_id)
  );
  CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    source_channel TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE customer_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    identity_type TEXT NOT NULL,
    provider TEXT,
    identity_value TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (identity_type, provider, identity_value)
  );
`;
