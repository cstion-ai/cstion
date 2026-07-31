import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { z } from "zod";
import { safeLogPayload } from "../platform/redaction.js";
import { DatabaseUrlSchema } from "../shared/config.js";
import { isMainModule } from "../shared/main-module.js";

const MigrationEnvironmentSchema = z.object({
  DATABASE_URL: DatabaseUrlSchema
});
const MIGRATION_FILES = ["001_harden_existing_schema.sql"];

export type DatabaseMigration = {
  readonly id: string;
  readonly sql: string;
};

export type MigrationClient = {
  query(
    sql: string,
    values?: readonly unknown[]
  ): Promise<{
    readonly rowCount: number | null;
  }>;
};

export async function applyDatabaseMigrations(
  client: MigrationClient,
  migrations: readonly DatabaseMigration[]
): Promise<void> {
  await client.query("BEGIN");
  try {
    await client.query(
      `SELECT pg_advisory_xact_lock(hashtextextended('travel-ai-schema-migrations', 0))`
    );
    await client.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         id TEXT PRIMARY KEY,
         applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`
    );

    for (const migration of migrations) {
      const existing = await client.query(
        `SELECT 1 AS applied FROM schema_migrations WHERE id = $1`,
        [migration.id]
      );
      if (existing.rowCount === 1) continue;
      if (existing.rowCount !== 0) {
        throw new MigrationInvariantError("Migration lookup returned an invalid row count");
      }

      await client.query(migration.sql);
      await client.query(
        `INSERT INTO schema_migrations (id) VALUES ($1)`,
        [migration.id]
      );
    }

    await client.query("COMMIT");
  } catch (error: unknown) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export async function runMigrationsFromEnvironment(
  environment: NodeJS.ProcessEnv = process.env
): Promise<void> {
  const { DATABASE_URL: connectionString } = MigrationEnvironmentSchema.parse(environment);
  const migrations = await Promise.all(
    MIGRATION_FILES.map(async (id) => ({
      id,
      sql: await readFile(new URL(`./migrations/${id}`, import.meta.url), "utf8")
    }))
  );
  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    await applyDatabaseMigrations(
      {
        query: async (sql, values = []) => {
          const result = await client.query(sql, [...values]);
          return { rowCount: Array.isArray(result) ? null : result.rowCount };
        }
      },
      migrations
    );
  } finally {
    client.release();
    await pool.end();
  }
}

class MigrationInvariantError extends Error {
  readonly name = "MigrationInvariantError";
}

if (isMainModule(import.meta.url)) {
  try {
    await runMigrationsFromEnvironment();
    console.log("Database migrations completed");
  } catch (error: unknown) {
    const loggableError = error instanceof Error
      ? error
      : { name: "UnknownMigrationError", message: "Unknown migration failure" };
    console.error(safeLogPayload({
      event: "database_migration_failed",
      error: loggableError
    }));
    process.exitCode = 1;
  }
}
