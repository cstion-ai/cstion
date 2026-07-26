import assert from "node:assert/strict";
import test from "node:test";
import { CustomerIdentityConflictError } from "../src/repositories/interfaces.js";
import {
  PostgresBookingRepository,
  PostgresCustomerRepository,
  PostgresIdempotencyRepository,
  type SqlClient,
  type SqlTransactionRunner
} from "../src/repositories/postgres-repositories.js";

test("Given overlapping identities, when a customer is upserted, then identity locks precede the lookup in one transaction", async () => {
  const database = new RecordingTransactionRunner();
  const repository = new PostgresCustomerRepository(database);

  const customer = await repository.upsertByIdentities({
    name: "김여행",
    sourceChannel: "kakao",
    identities: [
      { type: "phone", value: "+82-10-1111-2222" },
      { type: "channel", provider: "kakao", value: "user-1" }
    ],
    tags: ["travel-lead"]
  });

  assert.equal(customer.id, "44b235aa-9706-4916-872f-0256effbe7bc");
  assert.equal(database.transactionCount, 1);
  assert.deepEqual(database.operations.slice(0, 4), [
    "BEGIN",
    "LOCK channel:kakao:user-1",
    "LOCK phone::+82-10-1111-2222",
    "SELECT_IDENTITIES"
  ]);
  assert.deepEqual(database.identityProviders, ["kakao", ""]);
  assert.deepEqual(customer.identities, [
    { type: "channel", provider: "kakao", value: "user-1" },
    { type: "email", value: "traveler@example.com" },
    { type: "phone", value: "+82-10-1111-2222" }
  ]);
});

test("Given a failed event, when processing begins again, then the event is restarted", async () => {
  const client = new RecordingSqlClient([{ started: true }]);
  const repository = new PostgresIdempotencyRepository(client);

  const decision = await repository.begin({
    channel: "kakao",
    providerEventId: "retry-event"
  });

  assert.equal(decision.status, "started");
  assert.match(client.queries[0]?.sql ?? "", /DO UPDATE SET\s+status = 'processing'/);
  assert.match(client.queries[0]?.sql ?? "", /WHERE channel_events\.status = 'failed'/);
  assert.match(client.queries[0]?.sql ?? "", /processing_started_at/);
  assert.match(client.queries[0]?.sql ?? "", /processing_token/);
});

test("Given an existing booking id, when the lead is created again, then the insert is idempotent", async () => {
  const client = new RecordingSqlClient([]);
  const repository = new PostgresBookingRepository(client);

  await repository.createLead({
    id: "lead_kakao_retry-event",
    customerId: "44b235aa-9706-4916-872f-0256effbe7bc",
    destination: "제주",
    startDate: "2026-08-12",
    travelers: 2,
    productName: "패키지",
    status: "lead",
    memo: "redacted"
  });

  assert.match(client.queries[0]?.sql ?? "", /ON CONFLICT \(id\) DO NOTHING/);
});

test("Given an existing booking id with different data, when retried, then the stored lead is returned", async () => {
  const client = new ExistingBookingSqlClient();
  const repository = new PostgresBookingRepository(client);

  const stored = await repository.createLead({
    id: "lead_kakao_retry-event",
    customerId: "44b235aa-9706-4916-872f-0256effbe7bc",
    destination: "변경된 여행지",
    startDate: "2026-09-01",
    travelers: 4,
    productName: "변경 상품",
    status: "quoted"
  });

  assert.equal(stored.destination, "제주");
  assert.equal(stored.startDate, "2026-08-12");
  assert.equal(client.queryCount, 2);
});

test("Given identities owned by different customers, when upserting, then the conflict is rejected", async () => {
  const database = new ConflictingIdentityTransactionRunner();
  const repository = new PostgresCustomerRepository(database);

  await assert.rejects(
    repository.upsertByIdentities({
      name: "충돌 고객",
      sourceChannel: "kakao",
      identities: [
        { type: "phone", value: "+82-10-1111-2222" },
        { type: "channel", provider: "kakao", value: "user-conflict" }
      ],
      tags: ["travel-lead"]
    }),
    CustomerIdentityConflictError
  );
  assert.equal(database.mutationCount, 0);
});

class RecordingSqlClient implements SqlClient {
  readonly queries: Array<{ readonly sql: string; readonly values: readonly unknown[] }> = [];

  constructor(private readonly rows: Array<Record<string, unknown>>) {}

  async query(
    sql: string,
    values: readonly unknown[] = []
  ): Promise<{ readonly rows: readonly Readonly<Record<string, unknown>>[]; readonly rowCount: number }> {
    this.queries.push({ sql, values });
    return { rows: this.rows, rowCount: this.rows.length || 1 };
  }
}

class ExistingBookingSqlClient implements SqlClient {
  queryCount = 0;

  async query(
    sql: string
  ): Promise<{ readonly rows: readonly Readonly<Record<string, unknown>>[]; readonly rowCount: number }> {
    this.queryCount += 1;
    if (sql.includes("INSERT INTO booking_leads")) return { rows: [], rowCount: 0 };
    if (sql.includes("SELECT id, customer_id")) {
      return {
        rows: [{
          id: "lead_kakao_retry-event",
          customer_id: "44b235aa-9706-4916-872f-0256effbe7bc",
          destination: "제주",
          start_date: new Date(2026, 7, 12),
          end_date: null,
          travelers: 2,
          product_name: "패키지",
          status: "lead",
          memo_redacted: null
        }],
        rowCount: 1
      };
    }
    throw new UnexpectedTestQueryError(sql);
  }
}

class ConflictingIdentityTransactionRunner implements SqlTransactionRunner {
  mutationCount = 0;
  private lookupCount = 0;

  async transaction<T>(work: (client: SqlClient) => Promise<T>): Promise<T> {
    return work({ query: (sql, values) => this.query(sql, values) });
  }

  private async query(
    sql: string,
    _values: readonly unknown[] = []
  ): Promise<{ readonly rows: readonly Readonly<Record<string, unknown>>[]; readonly rowCount: number }> {
    if (sql.includes("pg_advisory_xact_lock")) return { rows: [], rowCount: 1 };
    if (sql.includes("SELECT c.id")) {
      this.lookupCount += 1;
      const id = this.lookupCount === 1 ? "11111111-1111-4111-8111-111111111111" : "22222222-2222-4222-8222-222222222222";
      return { rows: [{ id }], rowCount: 1 };
    }
    if (sql.includes("UPDATE") || sql.includes("INSERT")) this.mutationCount += 1;
    return { rows: [], rowCount: 0 };
  }
}

class RecordingTransactionRunner implements SqlTransactionRunner {
  readonly operations: string[] = [];
  readonly identityProviders: string[] = [];
  transactionCount = 0;

  async transaction<T>(work: (client: SqlClient) => Promise<T>): Promise<T> {
    this.transactionCount += 1;
    this.operations.push("BEGIN");
    const result = await work({ query: (sql, values) => this.query(sql, values) });
    this.operations.push("COMMIT");
    return result;
  }

  private async query(
    sql: string,
    values: readonly unknown[] = []
  ): Promise<{ readonly rows: readonly Readonly<Record<string, unknown>>[]; readonly rowCount: number }> {
    if (sql.includes("pg_advisory_xact_lock")) {
      this.operations.push(`LOCK ${String(values[0])}`);
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes("SELECT c.id")) {
      this.operations.push("SELECT_IDENTITIES");
      return {
        rows: [{ id: "44b235aa-9706-4916-872f-0256effbe7bc" }],
        rowCount: 1
      };
    }
    if (sql.includes("UPDATE customers")) {
      this.operations.push("UPDATE_CUSTOMER");
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes("INSERT INTO customer_identities")) {
      this.operations.push("INSERT_IDENTITY");
      this.identityProviders.push(String(values[2]));
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes("SELECT identity_type")) {
      this.operations.push("SELECT_CUSTOMER_IDENTITIES");
      return {
        rows: [
          { identity_type: "channel", provider: "kakao", identity_value: "user-1" },
          { identity_type: "email", provider: "", identity_value: "traveler@example.com" },
          { identity_type: "phone", provider: "", identity_value: "+82-10-1111-2222" }
        ],
        rowCount: 3
      };
    }
    throw new UnexpectedTestQueryError(sql);
  }
}

class UnexpectedTestQueryError extends Error {
  readonly name = "UnexpectedTestQueryError";

  constructor(readonly sql: string) {
    super(`Unexpected SQL in test: ${sql}`);
  }
}
