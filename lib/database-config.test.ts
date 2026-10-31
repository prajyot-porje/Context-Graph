import { describe, expect, it } from "vitest";
import { databaseConnectionConfig } from "./database-config";
describe("database transport policy", () => {
  it("trusts the bundled public CA only for actual Supabase hosts", () => {
    const config = databaseConnectionConfig({
      SUPABASE_DATABASE_URL:
        "postgres://fixture@aws-0-region.pooler.supabase.com/postgres",
    });
    expect(config.ssl && config.ssl.ca).toContain("BEGIN CERTIFICATE");
    const unrelated = databaseConnectionConfig({
      SUPABASE_DATABASE_URL:
        "postgres://fixture@supabase.com.attacker.test/postgres",
    });
    expect(unrelated.ssl && unrelated.ssl.ca).toBeUndefined();
  });
  it("does not let connection URL options disable certificate validation", () => {
    const config = databaseConnectionConfig({
      SUPABASE_DATABASE_URL:
        "postgres://fixture:fixture@db.example.test/postgres?ssl=0&sslmode=no-verify&sslrootcert=bad",
      DATABASE_CA_CERT: "cert\\nline",
    });
    expect(config.connectionString).not.toContain("sslmode");
    expect(config.connectionString).not.toContain("sslrootcert");
    expect(config.connectionString).not.toContain("ssl=");
    expect(config.ssl).toEqual({ rejectUnauthorized: true, ca: "cert\nline" });
  });
  it("allows plaintext only for explicit isolated loopback databases", () => {
    expect(
      databaseConnectionConfig({
        SUPABASE_DATABASE_URL: "postgres://fixture@127.0.0.1/db",
        DATABASE_SSL: "false",
      }).ssl,
    ).toBe(false);
    expect(() =>
      databaseConnectionConfig({
        SUPABASE_DATABASE_URL: "postgres://fixture@remote.example/db",
        DATABASE_SSL: "false",
      }),
    ).toThrow("loopback");
  });
});
