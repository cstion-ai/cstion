import { Pool, type PoolClient, type PoolConfig } from "pg";
import type { SqlClient, SqlTransactionRunner } from "./postgres-repositories.js";

export type PostgresDatabaseOptions = {
  readonly connectionString: string;
};

export class PostgresDatabase implements SqlClient, SqlTransactionRunner {
  private readonly pool: Pool;

  constructor(options: PostgresDatabaseOptions) {
    const poolConfig = {
      connectionString: options.connectionString,
      max: 10,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000
    } satisfies PoolConfig;
    this.pool = new Pool(poolConfig);
  }

  async query(
    sql: string,
    values: readonly unknown[] = []
  ): Promise<{
    readonly rows: readonly Readonly<Record<string, unknown>>[];
    readonly rowCount: number | null;
  }> {
    const result = await this.pool.query(sql, [...values]);
    return { rows: result.rows, rowCount: result.rowCount };
  }

  async transaction<T>(work: (client: SqlClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await work(new PostgresTransactionClient(client));
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

class PostgresTransactionClient implements SqlClient {
  constructor(private readonly client: PoolClient) {}

  async query(
    sql: string,
    values: readonly unknown[] = []
  ): Promise<{
    readonly rows: readonly Readonly<Record<string, unknown>>[];
    readonly rowCount: number | null;
  }> {
    const result = await this.client.query(sql, [...values]);
    return { rows: result.rows, rowCount: result.rowCount };
  }
}
