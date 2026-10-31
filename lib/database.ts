import { Pool, types, type PoolClient, type QueryResultRow } from "pg";
import { databaseConnectionConfig } from "./database-config";
types.setTypeParser(1700, Number);

const globalDb = globalThis as unknown as {
  contextPool?: Pool;
  contextAuthLockPool?: Pool;
};
export const database =
  globalDb.contextPool ??
  new Pool({
    ...databaseConnectionConfig(),
    max: Number(process.env.DATABASE_POOL_MAX || 3),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
if (process.env.NODE_ENV !== "production") globalDb.contextPool = database;

// Locks use a separate small pool. Holding every application-pool connection
// while waiting for Better Auth's queries would otherwise cause starvation.
export const authLockDatabase =
  globalDb.contextAuthLockPool ??
  new Pool({
    ...databaseConnectionConfig(),
    max: 2,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
if (process.env.NODE_ENV !== "production")
  globalDb.contextAuthLockPool = authLockDatabase;

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
