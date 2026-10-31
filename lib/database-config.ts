import { SUPABASE_CA } from "./supabase-ca";

/** Keep URL SSL parameters from overriding explicit certificate validation. */
export function databaseConnectionConfig(
  env: Record<string, string | undefined> = process.env,
) {
  if (!env.SUPABASE_DATABASE_URL) return {};
  const url = new URL(env.SUPABASE_DATABASE_URL);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const supabase = /(^|\.)supabase\.(com|co)$/.test(url.hostname.toLowerCase());
  const ca =
    env.DATABASE_CA_CERT?.replace(/\\n/g, "\n") ||
    (supabase ? SUPABASE_CA : undefined);
  if (env.DATABASE_SSL === "false" && !local)
    throw new Error(
      "Unencrypted database connections are allowed only on loopback.",
    );
  for (const key of [
    "ssl",
    "sslmode",
    "sslcert",
    "sslkey",
    "sslrootcert",
    "sslnegotiation",
    "uselibpqcompat",
  ])
    url.searchParams.delete(key);
  return {
    connectionString: url.toString(),
    ssl:
      env.DATABASE_SSL === "false"
        ? (false as const)
        : {
            rejectUnauthorized: true,
            ...(ca ? { ca } : {}),
          },
  };
}
