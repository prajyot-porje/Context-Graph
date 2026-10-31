import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { testDatabase } from "./database";
import { mailFixture } from "./mail-fixture";

let db: Awaited<ReturnType<typeof testDatabase>>;
let mail: Awaited<ReturnType<typeof mailFixture>>;
let auth: (typeof import("../lib/auth"))["auth"];
let flow: (typeof import("../lib/auth-flow"))["handleAuthFlow"];
const origin = "http://localhost:3000";
const password = "owner-password-12345";
beforeAll(async () => {
  mail = await mailFixture();
  Object.assign(process.env, {
    GMAIL_SMTP_USER: "fixture@gmail.com",
    GMAIL_SMTP_APP_PASSWORD: "fixture-only",
    GMAIL_SMTP_TEST_PORT: String(mail.port),
    GOOGLE_CLIENT_ID: "",
    GOOGLE_CLIENT_SECRET: "",
  });
  db = await testDatabase();
  auth = (await import("../lib/auth")).auth;
  flow = (await import("../lib/auth-flow")).handleAuthFlow;
}, 120000);
afterAll(async () => {
  await db?.stop();
  await mail?.close();
}, 30000);
beforeEach(async () => {
  await db.database.query("DELETE FROM auth_request_limits");
  mail.reject(false);
});
function call(action: string, body: object, requestOrigin = origin) {
  return flow(
    new Request(`${origin}/api/account/${action}`, {
      method: "POST",
      headers: { origin: requestOrigin, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    action,
  );
}
async function send(email: string, mode: "signup" | "recovery" = "signup") {
  const result = await call("send", { email, mode });
  expect(result.status, await result.clone().text()).toBe(200);
  expect(mail.emails.get(email)).toMatch(/^\d{6}$/);
  return mail.emails.get(email)!;
}
describe("authentication ownership and Gmail SMTP lifecycle", () => {
  it("uses proof before password, consumes OTP once, and supports normal password login", async () => {
    const email = `${randomUUID()}@example.test`,
      otp = await send(email);
    const user = (
      await db.database.query('SELECT * FROM "user" WHERE email=$1', [email])
    ).rows[0];
    expect(user.emailVerified).toBe(false);
    expect(
      (
        await db.database.query('SELECT * FROM session WHERE "userId"=$1', [
          user.id,
        ])
      ).rowCount,
    ).toBe(0);
    const stored = (
      await db.database.query(
        "SELECT value FROM verification WHERE identifier=$1",
        [`forget-password-otp-${email}`],
      )
    ).rows[0].value;
    expect(stored).not.toContain(otp);
    expect((await call("check", { email, otp })).status).toBe(200);
    expect((await call("complete", { email, otp, password })).status).toBe(200);
    expect(
      (await call("complete", { email, otp, password: "another-password-123" }))
        .status,
    ).toBe(400);
    const signedIn = await auth.api.signInEmail({ body: { email, password } });
    expect(signedIn.token).toBeTruthy();
  });
  it("replaces an attacker-pre-registered password when the owner claims a duplicate signup", async () => {
    const email = `${randomUUID()}@example.test`;
    await auth.api.signUpEmail({
      body: { email, name: "Attacker", password: "attacker-password-123" },
    });
    const otp = await send(email);
    expect((await call("complete", { email, otp, password })).status).toBe(200);
    await expect(
      auth.api.signInEmail({
        body: { email, password: "attacker-password-123" },
      }),
    ).rejects.toThrow();
    expect(
      (await auth.api.signInEmail({ body: { email, password } })).token,
    ).toBeTruthy();
    expect(
      auth.options.account?.accountLinking?.requireLocalEmailVerified,
    ).toBe(true);
  });
  it("adds a password to a Google-only account and preserves its verified Google binding", async () => {
    const id = randomUUID(),
      email = `${id}@example.test`;
    await db.database.query(
      'INSERT INTO "user"(id,name,email,"emailVerified",onboarding_done) VALUES($1,$2,$3,true,false)',
      [id, "Google Member", email],
    );
    await db.database.query(
      'INSERT INTO account(id,"userId","providerId","accountId","createdAt","updatedAt") VALUES($1,$2,$3,$2,now(),now())',
      [randomUUID(), id, "google"],
    );
    const otp = await send(email, "recovery");
    expect((await call("complete", { email, otp, password })).status).toBe(200);
    expect(
      (await auth.api.signInEmail({ body: { email, password } })).token,
    ).toBeTruthy();
    expect(
      (
        await db.database.query(
          'SELECT * FROM account WHERE "userId"=$1 AND "providerId"=$2',
          [id, "google"],
        )
      ).rowCount,
    ).toBe(1);
  });
  it("revokes old sessions immediately after recovery, including cached-cookie attempts", async () => {
    const email = `${randomUUID()}@example.test`,
      otp = await send(email);
    await call("complete", { email, otp, password });
    const response = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    });
    const cookie = response.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
    expect(
      await auth.api.getSession({ headers: new Headers({ cookie }) }),
    ).toBeTruthy();
    await db.database.query("DELETE FROM auth_request_limits");
    const recovery = await send(email, "recovery");
    expect(
      (
        await call("complete", {
          email,
          otp: recovery,
          password: "new-owner-password-123",
        })
      ).status,
    ).toBe(200);
    expect(
      await auth.api.getSession({ headers: new Headers({ cookie }) }),
    ).toBeNull();
    await expect(
      auth.api.signInEmail({ body: { email, password } }),
    ).rejects.toThrow();
  });
  it("limits failed attempts, expiry, purpose confusion and concurrent completion", async () => {
    const email = `${randomUUID()}@example.test`,
      otp = await send(email);
    const wrong = otp === "000000" ? "111111" : "000000";
    for (let n = 0; n < 3; n++)
      expect(
        (await call("complete", { email, otp: wrong, password })).status,
      ).toBe(400);
    expect((await call("complete", { email, otp, password })).status).toBe(400);
    await db.database.query("DELETE FROM auth_request_limits");
    const next = await send(email, "recovery");
    await db.database.query(
      "UPDATE verification SET \"expiresAt\"=now()-interval '1 second' WHERE identifier=$1",
      [`forget-password-otp-${email}`],
    );
    expect(
      (await call("complete", { email, otp: next, password })).status,
    ).toBe(400);
    await db.database.query("DELETE FROM auth_request_limits");
    const final = await send(email, "recovery");
    const outcomes = await Promise.all([
      call("complete", { email, otp: final, password }),
      call("complete", {
        email,
        otp: final,
        password: "concurrent-password-123",
      }),
    ]);
    expect(outcomes.filter((r) => r.status === 200)).toHaveLength(1);
    expect(outcomes.every((r) => [200, 400, 409].includes(r.status))).toBe(
      true,
    );
    expect(
      (await call("complete", { email, otp: final, password })).status,
    ).toBe(400);
  });
  it("rejects cross-origin requests, reports SMTP failure, and limits resend across flows", async () => {
    const email = `${randomUUID()}@example.test`;
    expect(
      (
        await call(
          "send",
          { email, mode: "signup" },
          "https://unrelated.vercel.app",
        )
      ).status,
    ).toBe(403);
    mail.reject(true);
    expect((await call("send", { email, mode: "signup" })).status).toBe(503);
    expect(mail.emails.has(email)).toBe(false);
    mail.reject(false);
    expect((await call("send", { email, mode: "recovery" })).status).toBe(429);
    const anonymous = await call("send", {
      email: `${randomUUID()}@example.test`,
      mode: "recovery",
    });
    expect(anonymous.status).toBe(200);
    expect(await anonymous.json()).toMatchObject({ success: true });
  });
  it("enforces shared rate budgets atomically under concurrency", async () => {
    const { consumeAuthLimit } = await import("../lib/db");
    const results = await Promise.all(
      Array.from({ length: 12 }, () => consumeAuthLimit("fixture-key", 60, 3)),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(3);
  });
  it("blocks public legacy signup, verification and passwordless bypasses", async () => {
    for (const path of [
      "/sign-up/email",
      "/email-otp/verify-email",
      "/sign-in/email-otp",
      "/email-otp/reset-password",
    ]) {
      const response = await auth.handler(
        new Request(`${origin}/api/auth${path}`, {
          method: "POST",
          headers: { origin, "content-type": "application/json" },
          body: JSON.stringify({
            email: "victim@example.test",
            password,
            otp: "000000",
          }),
        }),
      );
      expect(response.status).toBe(404);
    }
  });
  it("serializes public login/session issuance with recovery and releases locks after failures", async () => {
    const { withAuthIdentityLock } = await import("../lib/db");
    const { authIdentity } = await import("../lib/auth-policy");
    const { POST: login } = await import("../app/api/auth/[...all]/route");
    const email = `${randomUUID()}@example.test`,
      otp = await send(email);
    await call("complete", { email, otp, password });
    await db.database.query("DELETE FROM auth_request_limits");
    const recovery = await send(email, "recovery");
    let unlock!: () => void, acquired!: () => void;
    const ready = new Promise<void>((resolve) => {
      acquired = resolve;
    });
    const held = withAuthIdentityLock(
      authIdentity(`credential:${email}`),
      async () => {
        acquired();
        await new Promise<void>((resolve) => {
          unlock = resolve;
        });
      },
    );
    await ready;
    try {
      const request = new Request(`${origin}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { origin, "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      expect((await login(request)).status).toBe(409);
      expect(
        (
          await call("complete", {
            email,
            otp: recovery,
            password: "recovered-owner-password",
          })
        ).status,
      ).toBe(409);
    } finally {
      unlock();
      await held;
    }
    expect(
      (
        await call("complete", {
          email,
          otp: recovery,
          password: "recovered-owner-password",
        })
      ).status,
    ).toBe(200);
    const old = new Request(`${origin}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    expect((await login(old)).status).toBe(401);
  });
  it("bounds chunked bodies before parsing and rejects oversized login requests", async () => {
    const { readAuthBody } = await import("../lib/api/auth-body");
    await expect(
      readAuthBody(
        new Request(`${origin}/api/account/send`, {
          method: "POST",
          body: "x".repeat(5000),
        }),
      ),
    ).rejects.toThrow();
    const { POST: login } = await import("../app/api/auth/[...all]/route");
    const oversized = new Request(`${origin}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { origin },
      body: JSON.stringify({
        email: "owner@example.test",
        password: "x".repeat(5000),
      }),
    });
    expect((await login(oversized)).status).toBe(413);
    expect(
      (
        await call("send", {
          email: "owner@example.test",
          mode: "signup",
          extra: "x".repeat(5000),
        })
      ).status,
    ).toBe(413);
  });
  it("rejects a code issued for another purpose", async () => {
    const email = `${randomUUID()}@example.test`,
      otp = await send(email);
    await db.database.query(
      "UPDATE verification SET identifier=$1 WHERE identifier=$2",
      [`email-verification-otp-${email}`, `forget-password-otp-${email}`],
    );
    expect((await call("complete", { email, otp, password })).status).toBe(400);
  });
});
