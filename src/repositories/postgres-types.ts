export type SqlClient = {
  query(
    sql: string,
    values?: readonly unknown[]
  ): Promise<{
    readonly rows: readonly Readonly<Record<string, unknown>>[];
    readonly rowCount: number | null;
  }>;
};

export type SqlTransactionRunner = {
  transaction<T>(work: (client: SqlClient) => Promise<T>): Promise<T>;
};

export class PostgresInvariantError extends Error {
  readonly name = "PostgresInvariantError";
}
