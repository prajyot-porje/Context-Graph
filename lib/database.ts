import { Pool, types, type PoolClient, type QueryResultRow } from "pg";
types.setTypeParser(1700, Number);

const globalDb = globalThis as unknown as { contextPool?: Pool };
export const database =
  globalDb.contextPool ??
  new Pool({
    connectionString: process.env.SUPABASE_DATABASE_URL,
    max: Number(process.env.DATABASE_POOL_MAX || 3),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    ssl:
      process.env.DATABASE_SSL === "false"
        ? false
        : process.env.SUPABASE_DATABASE_URL?.includes("supabase")
          ? { rejectUnauthorized: false }
          : undefined,
  });
if (process.env.NODE_ENV !== "production") globalDb.contextPool = database;

export async function query<T extends QueryResultRow>(
  sql: string,
  values: unknown[] = [],
) {
  return (await database.query<T>(sql, values)).rows;
}

export async function transaction<T>(
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
