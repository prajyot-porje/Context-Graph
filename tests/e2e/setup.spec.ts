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
  const result = await page.request.post("/api/auth/sign-up/email", {
    data: { name: "Demo Developer", email, password: "test-password-123" },
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
  const verified = await page.request.post("/api/auth/email-otp/verify-email", {
    data: { email, otp },
    headers: { Origin: origin },
  });
  expect(verified.ok(), await verified.text()).toBeTruthy();
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
  await page.screenshot({path:'.test-output/oauth-consent-desktop.png',fullPage:true});
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
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.evaluate(() => {
    localStorage.setItem('cg-theme','dark');
    document.documentElement.setAttribute('data-theme','dark');
  });
  await page.waitForTimeout(500);
  await page.screenshot({path:'.test-output/setup-choose-dark.png',fullPage:true,animations:'disabled'});
  await page.setViewportSize({width:390,height:844});
  await expect(page.getByRole('link',{name:'How your context is processed'})).toBeVisible();
  await page.screenshot({path:'.test-output/setup-choose-mobile.png',fullPage:true,animations:'disabled'});
  await page.setViewportSize({width:1280,height:800});
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
  await page.getByRole("button", { name: "Notes view", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your context", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: ".test-output/dashboard-desktop.png",
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
  await page.goto('/connect');
  await expect(page.getByRole('heading',{name:'Connect Claude',exact:true})).toBeVisible();
  await page.screenshot({path:'.test-output/setup-connect-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'.test-output/setup-connect-mobile.png',fullPage:true});
  await page.setViewportSize({width:1280,height:800});
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
  await expect(page.getByRole('heading',{name:'Choose what to remember'})).toBeVisible();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/connect/);
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
    localStorage.setItem('cg-theme','dark');
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
  // Production Better Auth permits three OTP verifications per IP/minute.
  // Earlier cases share this loopback IP. Respect the real throttle rather than
  // disabling auth protections or forging proxy headers in the test app.
  await page.waitForTimeout(61000);
  const email = `ui-${randomBytes(6).toString("hex")}@example.test`;
  await page.goto("/signup");
  await page.getByLabel("Name", { exact: true }).fill("UI Developer");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("test-password-123");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("test-password-123");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByPlaceholder("000000")).toBeVisible();
  const code = (
    await (
      await page.request.get(`http://127.0.0.1:3101/otp?email=${email}`)
    ).json()
  ).otp;
  await page.getByPlaceholder("000000").fill(code);
  await page
    .getByRole("button", { name: "Verify code & proceed", exact: true })
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
    localStorage.setItem('cg-theme','dark');
    document.documentElement.setAttribute("data-theme", "dark");
  });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: ".test-output/setup-choose-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'.test-output/setup-choose-mobile.png',fullPage:true});
});
