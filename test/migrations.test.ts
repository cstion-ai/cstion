import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  applyDatabaseMigrations,
  type DatabaseMigration,
  type MigrationClient
} from "../src/repositories/migrate.js";

const MIGRATION_URL = new URL(
  "../src/repositories/migrations/001_harden_existing_schema.sql",
  import.meta.url
);

test("existing identity and event rows have an executable hardening migration", async () => {
  const sql = await readFile(MIGRATION_URL, "utf8");

  assert.match(sql, /COALESCE\(provider, ''\)/);
  assert.match(sql, /SET provider = ''/);
  assert.match(sql, /ALTER COLUMN provider SET NOT NULL/);
  assert.match(sql, /processing_started_at/);
  assert.match(sql, /processing_token/);
  assert.match(sql, /error_classification = 'permanent'/);
  assert.ok(
    sql.indexOf("COUNT(DISTINCT customer_id)") < sql.indexOf("SET provider = ''")
  );
});

test("database migrations are recorded and not applied twice", async () => {
  const migration: DatabaseMigration = {
    id: "001_test.sql",
    sql: "SELECT 'migration-body'"
  };
  const firstClient = new RecordingMigrationClient(false);
  await applyDatabaseMigrations(firstClient, [migration]);

  assert.equal(firstClient.migrationExecutions, 1);
  assert.deepEqual(firstClient.operations, [
    "BEGIN",
    "LOCK",
    "CREATE_MIGRATIONS_TABLE",
    "CHECK_MIGRATION",
    "APPLY_MIGRATION",
    "RECORD_MIGRATION",
    "COMMIT"
  ]);

  const secondClient = new RecordingMigrationClient(true);
  await applyDatabaseMigrations(secondClient, [migration]);
  assert.equal(secondClient.migrationExecutions, 0);
});

test("database migration failure rolls back without recording success", async () => {
  const client = new RecordingMigrationClient(false, true);

  await assert.rejects(
    applyDatabaseMigrations(client, [{
      id: "001_test.sql",
      sql: "SELECT 'migration-body'"
    }]),
    SimulatedMigrationError
  );
  assert.equal(client.operations.at(-1), "ROLLBACK");
  assert.doesNotMatch(client.operations.join(","), /RECORD_MIGRATION/);
});

class RecordingMigrationClient implements MigrationClient {
  readonly operations: string[] = [];
  migrationExecutions = 0;

  constructor(
    private readonly alreadyApplied: boolean,
    private readonly failMigration = false
  ) {}

  async query(
    sql: string
  ): Promise<{ readonly rows: readonly Readonly<Record<string, unknown>>[]; readonly rowCount: number }> {
    if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") {
      this.operations.push(sql);
      return { rows: [], rowCount: 0 };
    }
    if (sql.includes("pg_advisory_xact_lock")) {
      this.operations.push("LOCK");
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes("CREATE TABLE IF NOT EXISTS schema_migrations")) {
      this.operations.push("CREATE_MIGRATIONS_TABLE");
      return { rows: [], rowCount: 0 };
    }
    if (sql.includes("SELECT 1 AS applied FROM schema_migrations")) {
      this.operations.push("CHECK_MIGRATION");
      return { rows: this.alreadyApplied ? [{ applied: 1 }] : [], rowCount: this.alreadyApplied ? 1 : 0 };
    }
    if (sql === "SELECT 'migration-body'") {
      this.operations.push("APPLY_MIGRATION");
      this.migrationExecutions += 1;
      if (this.failMigration) throw new SimulatedMigrationError();
      return { rows: [], rowCount: 1 };
    }
    if (sql.includes("INSERT INTO schema_migrations")) {
      this.operations.push("RECORD_MIGRATION");
      return { rows: [], rowCount: 1 };
    }
    throw new UnexpectedMigrationQueryError(sql);
  }
}

class UnexpectedMigrationQueryError extends Error {
  readonly name = "UnexpectedMigrationQueryError";

  constructor(readonly sql: string) {
    super(`Unexpected migration query: ${sql}`);
  }
}

class SimulatedMigrationError extends Error {
  readonly name = "SimulatedMigrationError";
}
