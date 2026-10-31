import {
  test,
  expect,
  request as externalRequest,
  type Page,
} from "@playwright/test";
import { createHash, randomBytes } from "node:crypto";
const origin = "http://127.0.0.1:3100";

async function signup(page: Page) {
  const email = `demo-${randomBytes(6).toString("hex")}@example.test`;
  const result = await page.request.post("/api/account/send", {
    data: { email, mode: "signup" },
    headers: { Origin: origin },
  });
  expect(result.ok(), await result.text()).toBeTruthy();
  let otp = "";
  await expect
    .poll(async () => {
      otp = (
        await (
          await page.request.get(`http://127.0.0.1:3101/otp?email=${email}`)
        ).json()
      ).otp;
      return otp;
    })
    .toMatch(/^\d{6}$/);
  const verified = await page.request.post("/api/account/complete", {
    data: { email, otp, password: "test-password-123" },
    headers: { Origin: origin },
  });
  expect(verified.ok(), await verified.text()).toBeTruthy();
  let login = await page.request.post("/api/auth/sign-in/email", {
    data: { email, password: "test-password-123" },
    headers: { Origin: origin },
  });
  // The serial suite can hit the real per-IP login budget after recovery.
  // Respect its cooldown rather than relaxing production rate limits.
  if (login.status() === 429) {
    const retry = Math.min(
      60,
      Math.max(11, Number(login.headers()["retry-after"]) || 11),
    );
    await page.waitForTimeout((retry + 1) * 1000);
    login = await page.request.post("/api/auth/sign-in/email", {
      data: { email, password: "test-password-123" },
      headers: { Origin: origin },
    });
  }
  expect(login.ok(), await login.text()).toBeTruthy();
  return email;
}
async function oauth(page: Page, name: string) {
  const external = await externalRequest.newContext({ baseURL: origin });
  const registration = await external.post("/api/auth/oauth2/register", {
    data: {
      client_name: name,
      redirect_uris: [`${origin}/oauth-test-callback`],
      token_endpoint_auth_method: "none",
      application_type: "native",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      scope: "context:read context:write offline_access",
    },
  });
  expect(registration.ok(), await registration.text()).toBeTruthy();
  const client = await registration.json(),
    verifier = randomBytes(32).toString("base64url"),
    challenge = createHash("sha256").update(verifier).digest("base64url");
  const params = new URLSearchParams({
    client_id: client.client_id,
    redirect_uri: `${origin}/oauth-test-callback`,
    response_type: "code",
    scope: "context:read context:write offline_access",
    state: "fixture-state",
    resource: `${origin}/api/mcp`,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  await page.goto(`/api/auth/oauth2/authorize?${params}`);
  await expect(
    page.getByRole("button", { name: "Allow connection" }),
  ).toBeVisible();
  await page.screenshot({
    path: ".test-output/oauth-consent-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Allow connection" }).click();
  await page.waitForURL((url) => url.pathname === "/oauth-test-callback");
  const callback = new URL(page.url());
  expect(callback.searchParams.get("state")).toBe("fixture-state");
  const tokenResponse = await external.post("/api/auth/oauth2/token", {
    form: {
      grant_type: "authorization_code",
      client_id: client.client_id,
      redirect_uri: `${origin}/oauth-test-callback`,
      code: callback.searchParams.get("code")!,
      code_verifier: verifier,
      resource: `${origin}/api/mcp`,
    },
  });
  expect(tokenResponse.ok(), await tokenResponse.text()).toBeTruthy();
  const token = await tokenResponse.json();
  await external.dispose();
  let id = 0;
  const call = async (method: string, params: unknown) => {
    const response = await page.request.post("/api/mcp", {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        Accept: "application/json, text/event-stream",
      },
      data: { jsonrpc: "2.0", id: ++id, method, params },
    });
    expect(response.ok(), await response.text()).toBeTruthy();
    return response.json();
  };
  const initialized = await call("initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name, version: "1.0" },
  });
  expect(initialized.result.serverInfo.name).toBe("contextgraph");
  return { call, token, client };
}
test("fresh login never exposes an empty graph; manual context is reviewed and resumable", async ({
  page,
}) => {
  await signup(page);
  const bundles: string[] = [];
  page.on("request", (r) => bundles.push(r.url()));
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/connect/);
  await expect(
    page.getByRole("heading", { name: "Start with your AI" }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.evaluate(() => {
    localStorage.setItem("cg-theme", "dark");
    document.documentElement.setAttribute("data-theme", "dark");
  });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: ".test-output/setup-choose-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("link", { name: "How your context is processed" }),
  ).toBeVisible();
  await page.screenshot({
    path: ".test-output/setup-choose-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  expect(bundles.some((url) => /force-graph|three\.module/.test(url))).toBe(
    false,
  );
  await page
    .getByRole("button", { name: "Create context graph", exact: true })
    .click();
  await page
    .getByLabel("Your context")
    .fill("I prefer concise answers.\nI build with Next.js.");
  await page.getByRole("button", { name: "Review notes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Choose what to remember" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Note 1", { exact: true })).toHaveValue(
    "I prefer concise answers.",
  );
  await page
    .getByLabel("Note 1", { exact: true })
    .fill("I prefer concise technical answers.");
  await page
    .getByRole("button", { name: "Save 2 notes & open dashboard" })
    .click();
  await expect(page).toHaveURL(/dashboard/);
  const preview = await page.request.get("/api/context/preview?scope=me");
  expect((await preview.json()).assembled).toContain(
    "concise technical answers",
  );
  await expect(page.getByLabel("Graph summary")).toContainText(
    "2 saved notes · 4 connected items",
  );
  await expect(
    page.getByRole("button", { name: "Preview Context", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Add node", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Automatic capture enabled", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Manage connections", exact: true }),
  ).toBeVisible();
  await expect(page.locator("canvas").first()).toBeVisible();
  await page.getByRole("button", { name: "Fit graph", exact: true }).click();
  await page.waitForTimeout(650);
  await page.screenshot({
    path: ".test-output/ux-graph-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Notes view", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your context", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: ".test-output/dashboard-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: /I prefer concise technical answers/ })
    .click();
  await expect(
    page.getByRole("complementary", { name: "Saved note details" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("complementary", { name: "Saved note details" }),
  ).toHaveCount(0);
  const longDraft = await (
    await page.request.post("/api/imports", {
      headers: { Origin: origin },
      data: {
        provider: "manual",
        notes: Array.from({ length: 20 }, (_, i) => ({
          text: `Long saved note ${i}: ${"Useful actual context for testing scrolling. ".repeat(8)}`,
          kind: "note",
        })),
      },
    })
  ).json();
  const saved = await page.request.post(`/api/imports/${longDraft.id}`, {
    headers: { Origin: origin },
    data: { action: "commit", revision: longDraft.revision },
  });
  expect(saved.ok()).toBeTruthy();
  await page
    .getByRole("button", { name: "Refresh context", exact: true })
    .click();
  await expect(page.getByLabel("Graph summary")).toContainText(
    "22 saved notes",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  const scrolling = page.getByTestId("notes-scroll");
  const drawer = page.getByRole("complementary", { name: "Context scopes" });
  await expect(drawer).toBeHidden();
  await page.getByRole("button", { name: "Toggle menu", exact: true }).click();
  await expect(drawer).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await scrolling.hover();
  await page.mouse.wheel(0, 900);
  await expect
    .poll(() => scrolling.evaluate((el) => el.scrollTop))
    .toBeGreaterThan(100);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".test-output/ux-notes-mobile.png",
    fullPage: true,
  });
  await page.goto("/settings");
  await expect(
    page.getByRole("region", { name: "Account", exact: true }),
  ).toHaveAttribute("aria-busy", "false");
  expect(
    await page.evaluate(() =>
      document.documentElement.classList.contains("lenis"),
    ),
  ).toBe(false);
  await expect(
    page.getByRole("navigation", { name: "Settings sections" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Connected tools", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Connected tools", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: ".test-output/ux-settings-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/settings");
  await expect(
    page.getByRole("region", { name: "Account", exact: true }),
  ).toHaveAttribute("aria-busy", "false");
  await page.screenshot({
    path: ".test-output/ux-settings-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/connect");
  const back = page.getByRole("link", {
    name: "Back to dashboard",
    exact: true,
  });
  await expect(back).toBeVisible();
  expect(await back.evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe(
    "solid",
  );
  await page
    .getByRole("button", { name: /Claude Connect a remote connector/ })
    .click();
  await expect(page.getByLabel("Connector name", { exact: true })).toHaveValue(
    "ContextGraph",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".test-output/ux-setup-mobile.png",
    fullPage: true,
  });
});
test("real OAuth and MCP round trip: reviewed import, second client recall, deletion, revocation", async ({
  page,
}) => {
  await signup(page);
  await page.goto("/connect");
  await page
    .getByRole("button", { name: /Claude Connect a remote connector/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Connect Claude", exact: true }),
  ).toBeVisible();
  const status = await (await page.request.get("/api/setup/status")).json(),
    attempt = status.run.id;
  const claude = await oauth(page, "Claude fixture");
  const setup = await claude.call("tools/call", {
    name: "contextgraph_setup",
    arguments: { attempt_id: attempt },
  });
  expect(setup.result.isError).not.toBe(true);
  await page.goto("/connect");
  await expect(
    page.getByRole("heading", { name: "Connect Claude", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: ".test-output/setup-connect-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: ".test-output/setup-connect-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  const imported = await claude.call("tools/call", {
    name: "submit_context_import",
    arguments: {
      attempt_id: attempt,
      notes: [
        {
          text: "Uses PostgreSQL for ContextGraph.",
          kind: "decision",
          scope: "me",
        },
        { text: "Prefers verbose answers.", kind: "preference", scope: "me" },
      ],
    },
  });
  expect(imported.result.isError).not.toBe(true);
  await expect(
    page.getByRole("heading", { name: "Choose what to remember" }),
  ).toBeVisible();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/connect/);
  await page.getByRole("button", { name: /Prefers verbose answers/ }).click();
  await page
    .getByLabel("Note 2", { exact: true })
    .fill("Prefers concise answers.");
  await page
    .getByRole("button", { name: "Save 2 notes & open dashboard" })
    .click();
  await expect(page).toHaveURL(/dashboard/);
  const chatgpt = await oauth(page, "ChatGPT fixture");
  const refreshClient = await externalRequest.newContext({ baseURL: origin });
  const refreshed = await refreshClient.post("/api/auth/oauth2/token", {
    form: {
      grant_type: "refresh_token",
      client_id: chatgpt.client.client_id,
      refresh_token: chatgpt.token.refresh_token,
      resource: `${origin}/api/mcp`,
    },
  });
  expect(refreshed.ok(), await refreshed.text()).toBeTruthy();
  const refreshedToken = await refreshed.json();
  const loaded = await chatgpt.call("tools/call", {
    name: "get_context",
    arguments: {},
  });
  expect(loaded.result.content[0].text).toContain("Uses PostgreSQL");
  expect(loaded.result.content[0].text).toContain("Prefers concise");
  const remembered = await chatgpt.call("tools/call", {
    name: "remember",
    arguments: {
      text: "We chose email verification for every new account.",
      kind: "decision",
    },
  });
  expect(remembered.result.isError).not.toBe(true);
  await expect
    .poll(async () =>
      JSON.stringify(
        await claude.call("tools/call", {
          name: "recall",
          arguments: { query: "email verification" },
        }),
      ),
    )
    .toContain("email verification");
  const recalled = await claude.call("tools/call", {
    name: "recall",
    arguments: { query: "email verification" },
  });
  const records = JSON.parse(recalled.result.content[0].text);
  await claude.call("tools/call", {
    name: "forget",
    arguments: { entry_id: records[0].entry.id },
  });
  expect(
    JSON.stringify(
      await chatgpt.call("tools/call", { name: "get_context", arguments: {} }),
    ),
  ).not.toContain("We chose email verification");
  const connections = (
    await (await page.request.get("/api/setup/status")).json()
  ).connections;
  const disconnect = await page.request.delete(
    `/api/connections/${connections.find((c: { client_name: string }) => c.client_name === "ChatGPT fixture").id}`,
    { headers: { Origin: origin } },
  );
  expect(disconnect.ok()).toBeTruthy();
  const rejected = await page.request.post("/api/mcp", {
    headers: {
      Authorization: `Bearer ${chatgpt.token.access_token}`,
      Accept: "application/json,text/event-stream",
    },
    data: { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} },
  });
  expect(rejected.status()).toBe(401);
  const refreshRejected = await refreshClient.post("/api/auth/oauth2/token", {
    form: {
      grant_type: "refresh_token",
      client_id: chatgpt.client.client_id,
      refresh_token: refreshedToken.refresh_token,
      resource: `${origin}/api/mcp`,
    },
  });
  expect(refreshRejected.ok()).toBe(false);
  await refreshClient.dispose();
});
test("cancel, invalid input, keyboard/mobile layout, and ownership checks", async ({
  page,
  browser,
}) => {
  await signup(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.goto("/connect");
  await page
    .getByRole("button", { name: "Create context graph", exact: true })
    .click();
  await page.getByLabel("Your context").fill("Only a real user supplied fact.");
  await page.getByRole("button", { name: "Review notes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Choose what to remember" }),
  ).toBeVisible();
  const state = await (await page.request.get("/api/setup/status")).json();
  const other = await browser.newContext();
  const anonymous = await other.request.get(
    `${origin}/api/imports/${state.run.id}`,
  );
  expect(anonymous.status()).toBe(401);
  await other.close();
  await expect(
    page.getByRole("button", { name: "Save 1 note & open dashboard" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".test-output/setup-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.evaluate(() => {
    localStorage.setItem("cg-theme", "dark");
    document.documentElement.setAttribute("data-theme", "dark");
  });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: ".test-output/setup-review-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Discard import" }).click();
  await expect(
    page.getByRole("heading", { name: "Start with your AI" }),
  ).toBeVisible();
  expect(
    (await (await page.request.get("/api/setup/status")).json()).ready,
  ).toBe(false);
  const csrf = await page.request.post("/api/imports", {
    data: { provider: "manual" },
    headers: { Origin: "https://unrelated.example" },
  });
  expect(csrf.status()).toBe(403);
});
test("email signup, OTP verification and returning login through actual forms", async ({
  page,
}) => {
  const email = `ui-${randomBytes(6).toString("hex")}@example.test`;
  await page.goto("/signup");
  await expect(page.getByLabel("Name", { exact: true })).toHaveCount(0);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByRole("button", { name: "Send verification code", exact: true })
    .click();
  await expect(page.getByPlaceholder("000000")).toBeVisible();
  const code = (
    await (
      await page.request.get(`http://127.0.0.1:3101/otp?email=${email}`)
    ).json()
  ).otp;
  await page.getByPlaceholder("000000").fill(code);
  await page.getByRole("button", { name: "Verify code", exact: true }).click();
  await page
    .getByLabel("New password", { exact: true })
    .fill("test-password-123");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("test-password-123");
  await page
    .getByRole("button", { name: "Save password & sign in", exact: true })
    .click();
  await expect(page).toHaveURL(/connect/);
  const signedOut = await page.request.post("/api/auth/sign-out", {
    data: {},
    headers: { Origin: origin },
  });
  expect(signedOut.ok(), await signedOut.text()).toBeTruthy();
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("test-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/connect/);
  await page.evaluate(() => {
    localStorage.setItem("cg-theme", "dark");
    document.documentElement.setAttribute("data-theme", "dark");
  });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: ".test-output/setup-choose-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: ".test-output/setup-choose-mobile.png",
    fullPage: true,
  });
});

test("shared branding, typography and darker lime stay consistent across public pages", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator(".cg-brand").first()).toBeVisible();
  const displayFont = await page
    .locator("h1")
    .first()
    .evaluate((el) => getComputedStyle(el).fontFamily.split(",")[0]);
  const bodyFont = await page
    .locator(".cg-brand")
    .first()
    .evaluate((el) => getComputedStyle(el).fontFamily.split(",")[0]);
  expect(
    await page
      .locator(".cg-brand svg > circle")
      .first()
      .evaluate((el) => getComputedStyle(el).fill),
  ).toBe("rgb(143, 190, 40)");
  await page.screenshot({ path: ".test-output/ux-landing-desktop.png" });
  await page
    .getByRole("button", { name: "Switch to light mode", exact: true })
    .click();
  expect(
    await page
      .locator(".cg-brand svg > circle")
      .first()
      .evaluate((el) => getComputedStyle(el).fill),
  ).toBe("rgb(82, 121, 24)");
  const start = page.getByRole("link", { name: "Get Started", exact: true });
  expect(await start.evaluate((el) => getComputedStyle(el).color)).toBe(
    "rgb(255, 255, 255)",
  );
  expect((await start.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: ".test-output/ux-landing-mobile.png" });
  await page.goto("/login");
  expect(
    await page
      .locator(".cg-brand")
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily.split(",")[0]),
  ).toBe(bodyFont);
  expect(
    await page
      .locator("h1")
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily.split(",")[0]),
  ).toBe(displayFont);
  expect(
    await page.evaluate(() =>
      document.documentElement.classList.contains("lenis"),
    ),
  ).toBe(false);
  await page.screenshot({
    path: ".test-output/ux-login-mobile.png",
    fullPage: true,
  });
});

test("failed login preserves email and recovery screens reset the password", async ({
  page,
}) => {
  test.setTimeout(180000);
  const email = `recovery-${randomBytes(6).toString("hex")}@example.test`;
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("unknown-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Unable to sign in" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Create an account", exact: true })
    .click();
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue(email);
  await page
    .getByRole("button", { name: "Send verification code", exact: true })
    .click();
  await expect(page.getByLabel("Verification code")).toBeVisible();
  let code = (
    await (
      await page.request.get(`http://127.0.0.1:3101/otp?email=${email}`)
    ).json()
  ).otp;
  await page.getByLabel("Verification code").fill(code);
  await page.getByRole("button", { name: "Verify code", exact: true }).click();
  await page
    .getByLabel("New password", { exact: true })
    .fill("first-owner-password-123");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("first-owner-password-123");
  await page
    .getByRole("button", { name: "Save password & sign in", exact: true })
    .click();
  await expect(page).toHaveURL(/connect/);
  await page.request.post("/api/auth/sign-out", {
    data: {},
    headers: { Origin: origin },
  });
  // Recipient cooldown is a real server control. Do not disable it in tests.
  await page.waitForTimeout(61000);
  await page.goto(`/forgot-password?email=${encodeURIComponent(email)}`);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue(email);
  await page.screenshot({
    path: ".test-output/auth-recovery-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Send verification code", exact: true })
    .click();
  await expect(page.getByLabel("Verification code")).toBeVisible();
  code = (
    await (
      await page.request.get(`http://127.0.0.1:3101/otp?email=${email}`)
    ).json()
  ).otp;
  await page.getByLabel("Verification code").fill(code);
  await page.getByRole("button", { name: "Verify code", exact: true }).click();
  await page
    .getByLabel("New password", { exact: true })
    .fill("second-owner-password-123");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("second-owner-password-123");
  await page.screenshot({
    path: ".test-output/auth-password-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Save password & sign in", exact: true })
    .click();
  await expect(page).toHaveURL(/connect/);
  const old = await page.request.post("/api/auth/sign-in/email", {
    data: { email, password: "first-owner-password-123" },
    headers: { Origin: origin },
  });
  expect(old.status()).toBe(401);
});

test("auth controls stay locked until navigation finishes", async ({
  page,
}) => {
  const email = `busy-${randomBytes(6).toString("hex")}@example.test`;
  await page.goto("/signup");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByRole("button", { name: "Send verification code", exact: true })
    .click();
  await expect(page.getByLabel("Verification code")).toBeVisible();
  const code = (
    await (
      await page.request.get(`http://127.0.0.1:3101/otp?email=${email}`)
    ).json()
  ).otp;
  await page.getByLabel("Verification code").fill(code);
  let releaseCheck!: () => void;
  const checkGate = new Promise<void>((resolve) => {
    releaseCheck = resolve;
  });
  await page.route("**/api/account/check", async (route) => {
    await checkGate;
    await route.continue();
  });
  await page.getByRole("button", { name: "Verify code", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Use a different email", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("link", { name: "Back to sign in", exact: true }),
  ).toHaveAttribute("aria-disabled", "true");
  await page
    .getByRole("link", { name: "Back to sign in", exact: true })
    .dispatchEvent("click");
  await expect(page.getByLabel("Verification code")).toBeVisible();
  releaseCheck();
  await page
    .getByLabel("New password", { exact: true })
    .fill("busy-state-password-123");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("busy-state-password-123");
  let releaseEntry!: () => void;
  const entryGate = new Promise<void>((resolve) => {
    releaseEntry = resolve;
  });
  await page.route("**/entry**", async (route) => {
    await entryGate;
    await route.continue();
  });
  const signedIn = page.waitForResponse(
    (r) => r.url().endsWith("/api/auth/sign-in/email") && r.status() === 200,
  );
  await page
    .getByRole("button", { name: "Save password & sign in", exact: true })
    .click();
  await signedIn;
  await expect(
    page.getByRole("button", { name: "Opening your account…", exact: true }),
  ).toBeDisabled();
  await expect(page.getByLabel("New password", { exact: true })).toHaveValue(
    "busy-state-password-123",
  );
  await expect(
    page.getByRole("button", { name: "Show password" }).first(),
  ).toBeDisabled();
  await page.screenshot({ path: ".test-output/auth-redirect-locked.png" });
  releaseEntry();
  await expect(page).toHaveURL(/connect/);
});

test("large import review preserves edits and selections across filters and pages", async ({
  page,
}) => {
  await signup(page);
  const notes = Array.from({ length: 16 }, (_, i) => ({
    text: `Imported fact ${i + 1}`,
    kind: i % 2 ? "preference" : "note",
    scope: "me",
  }));
  await page.request.post("/api/imports", {
    headers: { Origin: origin },
    data: { provider: "export", notes },
  });
  await page.goto("/connect");
  await expect(
    page.getByRole("heading", { name: "Choose what to remember" }),
  ).toBeVisible();
  await expect(page.getByRole("checkbox")).toHaveCount(6);
  await page
    .getByRole("checkbox", { name: "Include note 1", exact: true })
    .uncheck();
  await page.getByRole("button", { name: "Next notes", exact: true }).click();
  await page.getByRole("button", { name: /Imported fact 7 / }).click();
  await page
    .getByLabel("Note 7", { exact: true })
    .fill("Edited fact on another page");
  await page.getByLabel("Filter note category").selectOption("preference");
  await expect(page.getByRole("checkbox")).toHaveCount(6);
  await page.getByLabel("Search proposed notes").fill("fact 16");
  await expect(page.getByRole("checkbox")).toHaveCount(1);
  await page
    .getByRole("checkbox", { name: "Include note 16", exact: true })
    .uncheck();
  await page.getByLabel("Search proposed notes").fill("");
  await page.getByLabel("Filter note category").selectOption("all");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".test-output/import-review-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", {
      name: "Save 14 notes & open dashboard",
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/dashboard/);
  const preview = (
    await (await page.request.get("/api/context/preview?scope=me")).json()
  ).assembled;
  expect(preview).toContain("Edited fact on another page");
  expect(preview).not.toContain("Imported fact 16");
});

test("switching AI cards preserves copied attempts and received drafts appear on step three", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await signup(page);
  await page.goto("/connect");
  await expect(
    page.getByRole("link", { name: "Settings", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /ChatGPT Connect a custom/ }).click();
  const original = (await (await page.request.get("/api/setup/status")).json())
    .run.id;
  await page
    .getByRole("button", { name: "Copy connector name", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Copy connector name: copied",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Connector name copied.", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Illustrated setup preview")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Choose another AI", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Continue with ChatGPT", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /Claude Connect a remote/ }).click();
  await page
    .getByRole("button", { name: "Choose another AI", exact: true })
    .click();
  await page.getByRole("button", { name: /ChatGPT Connect a custom/ }).click();
  expect(
    (
      await (
        await page.request.get("/api/setup/status?attempt=" + original)
      ).json()
    ).run.id,
  ).toBe(original);
  const client = await oauth(page, "openai-mcp");
  const setup = await client.call("tools/call", {
    name: "contextgraph_setup",
    arguments: { attempt_id: original },
  });
  expect(JSON.stringify(setup)).toContain("waiting");
  await page.request.post("/api/imports/" + original, {
    headers: { Origin: origin },
    data: { action: "cancel" },
  });
  const next = await (
    await page.request.post("/api/imports", {
      headers: { Origin: origin },
      data: { provider: "chatgpt" },
    })
  ).json();
  const recovered = await client.call("tools/call", {
    name: "contextgraph_setup",
    arguments: { attempt_id: original },
  });
  expect(JSON.parse(recovered.result.content[0].text).attempt_id).toBe(next.id);
  expect(
    (await (await page.request.get("/api/imports/" + original)).json()).status,
  ).toBe("canceled");
  await page.goto("/connect?attempt=" + next.id);
  await page
    .getByRole("button", { name: "3 Choose what to share", exact: true })
    .click();
  await expect(
    page.getByText("Waiting for your approved context", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Refresh", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: ".test-output/connect-share-status.png",
    fullPage: true,
  });
  await client.call("tools/call", {
    name: "submit_context_import",
    arguments: {
      attempt_id: next.id,
      notes: [{ text: "Approved context survives switching providers." }],
    },
  });
  await expect(
    page.getByRole("heading", { name: "Choose what to remember", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Note 1", { exact: true })).toHaveValue(
    "Approved context survives switching providers.",
  );
  await page
    .getByRole("button", { name: "Save 1 note & open dashboard", exact: true })
    .click();
  await expect(page).toHaveURL(/dashboard/);
});

test("settings persist profile and appearance, revoke sessions and keys, and export private context", async ({
  page,
  browser,
}) => {
  const email = await signup(page);
  await page.request.post("/api/imports", {
    headers: { Origin: origin },
    data: {
      provider: "manual",
      notes: [{ text: "A real saved setting-test fact." }],
    },
  });
  const draft = (await (await page.request.get("/api/setup/status")).json())
    .run;
  await page.request.post("/api/imports/" + draft.id, {
    headers: { Origin: origin },
    data: { action: "commit", revision: draft.revision },
  });
  await page.goto("/settings");
  await expect(
    page.getByRole("region", { name: "Account", exact: true }),
  ).toHaveAttribute("aria-busy", "false");
  await page.getByLabel("Display name", { exact: true }).fill("Profile Owner");
  await page
    .getByRole("button", { name: "Use orbit icon", exact: true })
    .click();
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Profile saved.");
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Account", exact: true }),
  ).toHaveAttribute("aria-busy", "false");
  await expect(page.getByLabel("Display name", { exact: true })).toHaveValue(
    "Profile Owner",
  );
  await expect(
    page.getByRole("button", { name: "Use orbit icon", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const photo = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 96;
    return canvas.toDataURL("image/jpeg");
  });
  await page.getByLabel("Upload profile photo", { exact: true }).setInputFiles({
    name: "profile.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from(photo.split(",")[1], "base64"),
  });
  await expect(
    page.getByRole("button", { name: "Save profile", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Save profile", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Profile saved.");
  const savedPhoto = await (await page.request.get("/api/profile")).json();
  expect(savedPhoto.image).toMatch(/^data:image\/jpeg;base64,/);
  const rejected = await page.request.patch("/api/profile", {
    headers: { Origin: origin },
    data: { name: "Bad avatar", image: "https://untrusted.example/photo.svg" },
  });
  expect(rejected.status()).toBe(400);
  await page.getByRole("link", { name: "Appearance", exact: true }).click();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByLabel("Default dashboard view").selectOption("notes");
  await page.screenshot({
    path: ".test-output/settings-appearance-desktop.png",
    fullPage: true,
  });
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Your context", exact: true }),
  ).toBeVisible();
  await page.goto("/settings#capture");
  await page
    .getByRole("switch", { name: "Automatic context capture", exact: true })
    .click();
  await expect(
    page.getByRole("switch", {
      name: "Automatic context capture",
      exact: true,
    }),
  ).toHaveAttribute("aria-checked", "false");
  await page.reload();
  await expect(
    page.getByRole("switch", {
      name: "Automatic context capture",
      exact: true,
    }),
  ).toHaveAttribute("aria-checked", "false");
  await page.goto("/settings#security");
  await page
    .getByRole("button", { name: "Generate API key", exact: true })
    .click();
  await expect(page.getByLabel("New API key", { exact: true })).toBeVisible();
  const key = await page
    .getByLabel("New API key", { exact: true })
    .inputValue();
  expect(key).toMatch(/^ctx_/);
  await page.getByRole("button", { name: "Hide key", exact: true }).click();
  await page
    .getByRole("button", { name: "Revoke API key", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm change", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Generate API key", exact: true }),
  ).toBeVisible();
  const active = await (
    await page.request.get("/api/settings/sessions")
  ).json();
  expect(active.length).toBeGreaterThan(0);
  expect(active[0].token).toBeUndefined();
  const second = await browser.newContext();
  let login = await second.request.post(origin + "/api/auth/sign-in/email", {
    headers: { Origin: origin },
    data: { email, password: "test-password-123" },
  });
  if (login.status() === 429) {
    await page.waitForTimeout(12000);
    login = await second.request.post(origin + "/api/auth/sign-in/email", {
      headers: { Origin: origin },
      data: { email, password: "test-password-123" },
    });
  }
  expect(login.ok(), await login.text()).toBe(true);
  await page
    .getByRole("button", { name: "Refresh settings", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Sign out other sessions", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm change", exact: true })
    .click();
  expect(
    await (await second.request.get(origin + "/api/auth/get-session")).json(),
  ).toBeNull();
  await second.close();
  await page.goto("/settings#data");
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export context", exact: true })
    .click();
  expect((await downloadPromise).suggestedFilename()).toBe(
    "contextgraph-export.json",
  );
  const exported = await (
    await page.request.get("/api/settings/export")
  ).json();
  expect(JSON.stringify(exported)).toContain("A real saved setting-test fact.");
  expect(JSON.stringify(exported)).not.toContain(key);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/settings#account");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: ".test-output/settings-account-mobile.png",
    fullPage: true,
  });
  const other = await browser.newContext();
  await signup(await other.newPage());
  const stolen = await other.request.delete(origin + "/api/settings/sessions", {
    headers: { Origin: origin },
    data: { id: active[0].id },
  });
  expect(stolen.status()).toBe(404);
  await other.close();
});
