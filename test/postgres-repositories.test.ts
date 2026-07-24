import assert from "node:assert/strict";
import test from "node:test";
import {
  PostgresCustomerRepository,
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
});

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

  private async query<T extends Record<string, unknown>>(
    sql: string,
    values: readonly unknown[] = []
  ): Promise<{ readonly rows: T[]; readonly rowCount: number }> {
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
    throw new UnexpectedTestQueryError(sql);
  }
}

class UnexpectedTestQueryError extends Error {
  readonly name = "UnexpectedTestQueryError";

  constructor(readonly sql: string) {
    super(`Unexpected SQL in test: ${sql}`);
  }
}
