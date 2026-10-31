// Non-destructive HTTP checks. Never creates an account or sends an email.
import { mkdir, writeFile } from "node:fs/promises";
const args = process.argv.slice(2);
const base = new URL(
  args[args.indexOf("--base") + 1] || "http://localhost:3000",
).origin;
const cases: [string, string, number, Record<string, string>?][] = [
  ["GET", "/login", 200],
  ["GET", "/signup", 200],
  ["GET", "/forgot-password", 200],
  ["GET", "/api/auth/get-session", 200],
  ["GET", "/api/setup/status", 401],
  ["POST", "/api/auth/check-account", 410],
  ["POST", "/api/auth/sign-up/email", 404],
  ["POST", "/api/auth/email-otp/verify-email", 404],
  ["POST", "/api/account/send", 403, { Origin: "https://unrelated.example" }],
];
const checks = [];
for (const [method, path, expected, extra] of cases) {
  try {
    const result = await fetch(`${base}${path}`, {
      method,
      redirect: "manual",
      signal: AbortSignal.timeout(45000),
      headers:
        method === "POST"
          ? { "Content-Type": "application/json", Origin: base, ...extra }
          : undefined,
      // Empty input cannot create an account even against an older deployment.
      body: method === "POST" ? "{}" : undefined,
    });
    await result.arrayBuffer();
    checks.push({
      method,
      path,
      expected,
      actual: result.status,
      passed: result.status === expected,
    });
  } catch {
    checks.push({
      method,
      path,
      expected,
      actual: "unreachable",
      passed: false,
    });
  }
}
const report = {
  base,
  checkedAt: new Date().toISOString(),
  passed: checks.every((c) => c.passed),
  checks,
};
await mkdir(".test-output", { recursive: true });
await writeFile(
  `.test-output/auth-smoke-${base.includes("localhost") || base.includes("127.0.0.1") ? "local" : "deployed"}.json`,
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report));
if (!report.passed) process.exitCode = 1;
