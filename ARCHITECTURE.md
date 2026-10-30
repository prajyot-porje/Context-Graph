# ContextGraph — Architecture

Current reference updated 2026-10-30. Product intent belongs in PRODUCT.md, visual rules in DESIGN.md, workflow in AGENTS.md. Sections 1–9 describe current behavior; the log below is append-only history, including decisions since superseded.

## 1. System Overview

One Next.js deployment serves the website, Better Auth, and remote MCP at /api/mcp. Supabase PostgreSQL is the datastore. There is no separate Worker or Railway MCP server. Better Auth owns identity; private data is accessed only on the server. Tenant isolation is enforced in typed helpers by user ID, not Supabase Auth or auth.uid().

## 2. Tech Stack

Next.js 16.4.3, strict TypeScript, Tailwind v4, Better Auth and its OAuth provider 1.7.14, pg, official MCP SDK 1.32.2, Zod 4, react-force-graph-3d, Lenis, GSAP, OpenRouter/Gemini. See package-lock.json for exact dependencies. Node 22.13+ or Node 24 is recommended. Tailwind source discovery is restricted to app/components/lib so installed skills do not pollute generated CSS.

## 3. Directory Conventions

- app/entry: readiness-aware post-login destination. app/connect and components/connect: guided setup and reviewed import. app/oauth: signed login continuation and explicit consent.
- app/(app)/dashboard: guarded useful-context dashboard, lazy graph and text notes. Settings exposes real capture, connections and API key controls.
- app/api/setup, imports, connections, entries, context: session-authorized application routes; mutations validate Origin. All queries delegate to lib/db.ts.
- app/api/mcp: scoped OAuth/header-key protocol endpoint. Public discovery lives under app/.well-known. Health is not connection proof.
- lib/database.ts: shared bounded pg pool, numeric conversion, typed query/transaction boundary. lib/db.ts: parameterized tenant-scoped app SQL.
- lib/setup.ts: import contracts and consent-aware prompts. lib/context.ts: bounded active-context assembly. lib/process-staged.ts: leased queue processing.
- supabase: checked-in fresh auth snapshot, application snapshot, dated additive recovery and OAuth SQL. scripts/migrate-recovery.mts generates pinned-provider upgrades and defaults to dry run.
- tests and colocated tests: real disposable PostgreSQL integration, unit and Playwright browser tests. scripts/test-server.mts provides isolated local email/model boundaries.

Keep proxy.ts: this is the Next.js 16 convention. It is complemented by server-page/session guards; it is not the only authorization boundary.

## 4. Data Model

Better Auth owns user/session/account/verification plus JWKS and OAuth provider tables. Preserve exact provider migration definitions when upgrading. The legacy onboarding_done flag is retained for compatibility but does not establish readiness. capture_enabled controls routine capture.

context_nodes stores scoped core content. context_entries stores source-attributed, typed notes with dedupe hashes, resolution state and timestamps. Readiness requires nonempty core content or an active saved note; an empty root does not qualify. Imports and routine capture ensure root/intermediate scopes exist.

parent_scope is canonical. Edges are derived for reads and rebuilt transactionally on hierarchy changes; a stale context_edges row cannot override hierarchy. Parent validation rejects cycles and invalid parents. All reads and writes filter by authenticated user.

context_imports stores bounded drafts, provider, state, revision and submission digest. Submit is idempotent by digest; edits/commit check revisions. Commit locks the account and atomically adds selected notes, preserving existing graph and credentials. Cancellation, completion and expiry clear draft payloads. One approved note is sufficient. Expiry/retention constants are defined in lib/db.ts and checked-in SQL.

client_connections records observed authenticated MCP activity, self-reported client identity and a persistent revoked_before cutoff. Authorization alone is distinct from receiving a draft or saving context. OAuth reconnect cannot revive older tokens.

staged_context_entries has attempt counts, lease owner/expiry and processing state. Workers claim with FOR UPDATE SKIP LOCKED, recover expired leases, and cap automatic attempts at five. Pending and failed counts are visible; manual retry is explicit. Original text/kind/scope survive the judgment stage. A transaction saves accepted content and removes the queued item together.

mcp_request_limits enforces account-level 300 requests/hour atomically. Cleanup prunes old windows and expires drafts. Legacy API-key rate rows are also pruned. RLS is enabled as an anon-role backstop without browser policies. The server database role must have access; RLS is not the tenant authorization mechanism.

## 5. Auth Architecture

Website: Better Auth email/password plus verified OTP via Resend; Google appears only with both credentials. Both auth paths go through /entry unless continuing a signed OAuth flow. Session cookie cache is enabled. Secrets, database and user-private queries never reach the browser.

MCP: authorization code + PKCE through the maintained Better Auth OAuth provider, dynamic registration bound to the MCP resource, exact registered callbacks, context:read/context:write scopes and optional offline_access. Public issuer/resource discovery and explicit /api/auth/jwks verification share one canonical URL. Tokens must satisfy issuer/audience, active session/client checks and connection revocation cutoff. Refresh/consent credentials are removed on disconnect. Client names are unverified registration metadata.

Legacy terminal clients may send x-api-key or Bearer API keys. Only normalized SHA-256 hashes and prefixes persist. Replacement is atomic; imports never rotate keys. URL/query keys are rejected. MCP never authenticates using website cookies. Session routes use requireSessionUser; protocol routes use the OAuth/API-key verifier.

## 6. MCP Endpoint

Official SDK streamable HTTP with JSON responses and negotiated protocol replaces hand-rolled request dispatch. Tool surface: contextgraph_setup, submit_context_import, get_context, remember, recall, resolve, forget, list_nodes. Legacy save_context is accepted but not advertised. Read/write scopes are enforced at execution; request bodies and note payloads are bounded. Errors never echo credentials.

Connection does not import native ChatGPT/Claude memory. Setup returns a prompt; the client asks permission before sending a structured draft. Website review is the enforceable permanent-save boundary. A dashboard cannot command an idle external chat. Instructions therefore copy a prompt and open the appropriate client. No fake verification timer, invented facts, registered slash-command claim or full-memory claim is presented.

get_context assembles core content and active entries, including ancestor scopes, within one approximate budget. Resolved problems are excluded. recall is keyword search, not semantic search. remember queues capture only after setup and when capture is enabled. Next.js after() awaits draining; daily cron is a safety net, not a promise of continuous processing.

## 7. AI Judgment Layer

Gemini/OpenRouter fallback judgment validates a bounded batch response. Malformed/missing judgments retain work for bounded retry. Accepted notes retain submitted source text and scope rather than a fabricated model rewrite. Reviewed structured/manual imports bypass model judgment. Settings exposes capture pause, queue failure and retry. External model outages must not silently drop notes or pretend capture succeeded.

## 8. Known Architecture Debt and Limits

- Hosted ChatGPT/Claude UI and actual Google OAuth still require target-account smoke tests on a reachable HTTPS preview. Local protocol fixtures are not vendor UI verification.
- Existing production schema requires a reviewed dry-run and backup before additive upgrade. No production migration/deployment was performed during recovery implementation.
- Account editing/deletion and downloadable export are deferred and shown as unavailable; privacy disclosure states the actual storage/model boundaries.
- No semantic search, fuzzy superseding, teams, multiple graph workspaces, public sharing or digital twin in this iteration.
- Authenticated polling (10 seconds on dashboard, bounded backoff during setup, hidden-tab pause/focus refresh) replaces broken anon realtime. A future push transport needs its own authorization design.
- Historical unused Supabase helper/type artifacts may remain; runtime private-data paths use pg. Do not reintroduce browser queries by copying them.
- Automated load/capacity testing and operational alert delivery remain separate work. Queue failure is visible in the app.

## 9. Testing

npm test runs unit tests and a real temporary embedded PostgreSQL cluster. Browser tests run an independent temporary cluster, local capture-only email and model fixture servers and the actual Next.js application. Configuration is overwritten before app/auth imports so these tests never load live data or send provider traffic. See README for ports, fresh schema and optimized-build commands.

Tests cover readiness, transaction/idempotency behavior, duplicate capture, hierarchy, scoped context budgets, tenant isolation, leases/retries, auth continuation and revocation; Playwright covers actual signup/OTP/login forms, resumable manual/import review, OAuth PKCE/consent/refresh, second-client retrieval, remember/recall/forget, mobile layout and unauthorized/CSRF access. CI runs lint, unit/integration, build and Chromium E2E. Vendor API/browser boundaries use local fixtures; that limitation must accompany any completion claim.

## Architecture Log

### 2026-05-08 — Initial stack decisions (reconstructed)
Next.js App Router + TypeScript strict scaffolded. Better Auth chosen for identity over Supabase Auth specifically because MCP clients connect without cookies via a bearer API key — bridging that to Supabase's `auth.uid()`/RLS model would require minting JWTs server-side for every remote tool call, adding latency and a second auth system to maintain. Decision: Supabase accessed server-side only via the service-role key, with tenant isolation enforced *programmatically* (every `lib/db.ts` call takes and filters by `userId`) rather than via RLS. Consequence accepted: RLS is not a safety net here — a bug in a `lib/db.ts` filter is a real cross-tenant leak, not caught by the database.

### 2026-05-09 — Design system + auth/landing UI (reconstructed)
DESIGN.md tokens established. Auth pages and landing page built against them.

### 2026-05 to 2026-06 — Dashboard, context APIs, API keys (reconstructed)
Dashboard UI, `/api/context*` routes, and API key generation/settings wired to real Supabase reads/writes. Keys generated as `ctx_` + 24 random bytes, stored only as a SHA-256 hash + 12-char prefix — plaintext shown once at creation, never persisted.

### 2026-06 — OpenRouter fallback cascade stabilized (reconstructed, ref. commit 977c7a8)
Free-tier OpenRouter models rate-limit and deprecate often. Cascade added: try model N, on `429/404/502/503` fall through to model N+1, abort immediately on auth/bad-request errors. Chosen over a single-model + retry loop because deprecations (404) need a different model entirely, not a retry.

### 2026-06 — Switched graph visualization from React Flow to 3D WebGL (reconstructed, ref. commit 7c81ef9)
PRD originally specified React Flow (2D). Actual build uses `react-force-graph-3d` (Three.js) via `ContextGraph3D.tsx`; an earlier 2D `react-force-graph-2d` implementation (`components/graph/ContextGraph.tsx`) also exists but is no longer imported anywhere. Documented deviation from PRD — the "why" wasn't logged at the time; treat this as a real change of direction, not a bug, but the dead 2D component should be removed rather than left as ambiguous fallback code.

### 2026-06 — `context_edges` table added alongside `parent_scope` (reconstructed, ref. `scripts/migrate-edges.ts`)
Added an explicit edge table (backfilled from existing `parent_scope` relationships) so graph queries don't need to reconstruct hierarchy from a string field every time. `rate_limits` table scaffolded in the same period for future MCP rate limiting — never wired up. See debt list.

### 2026-07 — Onboarding rebuilt as a conversational flow (reconstructed, ref. commits 7b9db52, 5762b6f, eae0ad7)
Static 4-step form (`app/api/onboarding/route.ts` + `generateContextGraph()`) replaced by a streaming chat flow (`/api/onboarding/chat`) with a separate finalize step (`/api/onboarding/finalize`, Gemini-first / OpenRouter-fallback) that parses the conversation into graph nodes. The old form route was left in place rather than deleted — no longer reachable from the frontend. Landing page hero/intro sequence redesign (3D hero graph, cinematic intro) started in the same period and was left uncommitted when work paused.

### 2026-09-05 — Documentation consolidation
Replaced three overlapping product/architecture documents (`PRD.md`, `PRODUCT_DOCUMENT.md`, `technical_answers.md`) with two: this file (technical architecture + this log) and `PRODUCT.md` (business/product scope only). Rationale: the three old docs restated the same facts with drifting detail and no changelog, making it unclear which was current. Going forward, architectural changes are logged here instead of accumulating in a new standalone doc.

### 2026-09-05 — Corrected: `proxy.ts` was never dead code
The initial project audit concluded `proxy.ts` was silently dead — reasoning that Next.js only auto-loads middleware from a file named `middleware.ts`. That reasoning was stale: **Next.js 16 renamed the convention from `middleware.ts`/`middleware()` to `proxy.ts`/`proxy()`**, and this app is on Next 16.2.6. `proxy.ts` was almost certainly working correctly the whole time. Acting on the wrong diagnosis, it was renamed to `middleware.ts` earlier in this same session — which, in Next 16, only runs in the edge runtime (not configurable), and immediately crashed every route with "The edge runtime does not support Node.js 'crypto' module" (this file imports `lib/auth.ts`, which uses `pg.Pool`). Caught by actually booting the dev server and hitting the crash in a browser, rather than trusting static analysis alone. Reverted: renamed back to `proxy.ts`, function back to `proxy`. Lesson logged here so it isn't repeated: **do not rename `proxy.ts` to `middleware.ts` in this codebase.** If Next.js docs are consulted for this again, use version-matched docs (Next 16, not general/pre-16 knowledge) — see `node_modules/next/dist/docs/` per Next's own AGENTS.md guidance for this version.

### 2026-09-05 — MCP deployment documentation corrected
Confirmed with the project owner: there is no separate Railway or Cloudflare Worker MCP deployment. This Next.js app, deployed on Vercel, is the only real MCP server (`/api/mcp`). Removed the stale "deployed separately on Railway" claim from AGENTS.md and fixed `SettingsClient.tsx`, which hardcoded a placeholder Cloudflare Worker URL (and a placeholder Vercel domain) in its connection snippets — both now derive from `NEXT_PUBLIC_APP_URL`.

### 2026-09-06 — Google OAuth added as a Better Auth social provider
Evaluated removing Better Auth for a Google-only auth model; decided against it — Better Auth already supports Google as a `socialProviders` entry, so the session model, `requireSessionUser()`, and the `onboarding_done` field all stay unchanged. Added `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` and a "Continue with Google" option on both `/login` and `/signup`, routed through the same `proxy.ts` onboarding gate as email/password accounts — no separate signup-vs-login branching needed for the social path.

### 2026-09-05 — Dead code removed
Deleted `lib/mock-data.ts`, `lib/mock-entries.ts`, `components/graph/ContextGraph.tsx` (2D, superseded), `components/dashboard/CreateNodeDialog.tsx` (duplicate of `AddNodeModal.tsx`), `app/api/onboarding/route.ts` and `generateContextGraph()` in `lib/openrouter.ts` (superseded by the chat+finalize flow), `lib/supabase.ts`'s unused `createSupabaseBrowser`, and the now-unused `OnboardingAnswers` type. Also removed `test.css` (stray Tailwind build output, not imported anywhere) and stopped tracking `.impeccable/live/config.json` (local dev-tool session state — kept on disk, added to `.gitignore`).

### 2026-09-05 — Checked-in schema snapshot added
Added `supabase/schema.sql` reflecting the actual live schema (reverse-engineered from `types/index.ts`'s `Database` type plus `scripts/migrate.ts` and `scripts/migrate-edges.ts`), so the schema has one readable source instead of three scattered ones. This is a snapshot, not a migration framework — future schema changes should still add a new dated SQL file (or adopt a real migration tool) and get logged here, not just edit the snapshot silently.

### 2026-09-06 — Onboarding rebuilt as a structured wizard, chat flow removed
Replaced the chatbot-style onboarding (`ConversationalOnboarding.tsx`, `/api/onboarding/chat`) with a 5-step form wizard (`components/onboarding/OnboardingWizard.tsx` + `StepIdentity`/`StepStack`/`StepProjects`/`StepGoals`/`StepReview`), plus an explicit "import AI memory" first step (`MemoryImportStep.tsx`) instead of a mid-chat interruption. Rationale: the chat UI made the user re-explain themselves through an LLM roleplaying a form — slower, less predictable, and harder to correct than typed fields; the product owner (building this for their own portfolio) considered it unfinished-looking.

`app/api/onboarding/finalize/route.ts` now takes a structured JSON payload instead of a chat transcript. Node structure (`me`, optional `agency`, `personal/skills`, up to 3 project nodes, `personal/goals`) is built **deterministically in code** — no AI needed to infer shape from free text anymore, since the wizard already collected it as structured fields. AI (`judgeContext`, Gemini-first/OpenRouter-fallback) is called once per finalize, only to write rich prose `content` per node; if that call fails, deterministic fallback content is generated from the same facts so onboarding never hard-fails on an AI outage. `app/api/onboarding/chat/route.ts` deleted; new `app/api/onboarding/parse-memory/route.ts` handles the one-shot AI parse for the memory-import step (also degrades gracefully to blank fields on failure, never a dead end).

`GraphPreview.tsx` (the live mini-graph shown beside the wizard) now renders from real wizard state instead of regex-guessing labels out of chat text — a node only appears once the user has actually entered the data it represents.

The old `FINALIZE_STEPS` overlay (a hardcoded `setTimeout` checklist faking granular progress around what's actually one request/response) is replaced with a single honest "Building your graph — about 10 seconds" state.

Added `driver.js` (Nutlope-independent, kamranahmedse/driver.js, MIT) as a dependency for a one-time guided tour on `/connect` right after finalize: spotlights the API key, the client-tab strip, the code snippet, and Test Connection, in sequence. Reuses the existing `sessionStorage['cg-new-api-key']` flag (already set by finalize) to detect "just onboarded" rather than adding a new flag. Popover re-themed via `components/connect/driver-theme.css` against DESIGN.md tokens instead of the library's default look. A persistent "Take a tour" button lets returning users replay it.

Verified end-to-end against a live dev server: full wizard flow (fresh path), live graph preview updating per field, finalize producing real AI-authored node content and a working API key, and the driver.js tour auto-firing on `/connect` with correct popover content. One environment-only finding: the dev-only `Agentation` overlay (see §8) intercepts Enter/comma keydowns during `npm run dev`, which looked like a tag-input bug until isolated — the `onBlur` commit path (and real end users without this dev tool) are unaffected.

### 2026-09-10 — Email OTP verification via Resend, account linking, password confirmation & MCP SHA key hardening
- **Email verification & Resend integration**: Created `lib/email.ts` dispatching branded dark-mode emails with 6-digit verification codes via Resend API (`RESEND_API_KEY`). Configured `requireEmailVerification: true`, `autoSignInAfterVerification: true`, and Better Auth's `emailOTP` plugin in `lib/auth.ts` and `emailOTPClient` in `lib/auth-client.ts`.
- **Registration flow**: Upgraded `SignupClient.tsx` with a password confirmation check, duplicate account detection (`USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL`), and an in-place 6-digit OTP verification screen with countdown resend timer.
- **Account linking & login error clarity**: Added `account.accountLinking` with `trustedProviders: ['google']` to prevent duplicate accounts between Google and credentials. Enhanced `LoginClient.tsx` with precise error messages (email not found vs wrong password) and detection for unverified emails with one-click OTP resolution.
- **Landing page UX**: Replaced separate "Sign in" and "Sign up" navbar buttons with a single high-conversion "Get Started" button linking to `/login`.
- **MCP API key & SHA-256 hardening**: Sanitized API keys by stripping `Bearer ` and trimming whitespace/newlines before SHA hashing in `lib/db.ts`, `app/api/mcp/route.ts`, and `app/api/mcp/health/route.ts`. Added `Authorization` to CORS `Access-Control-Allow-Headers`. Added 1-click in-place "Regenerate Key" on `/connect` to eliminate copying masked bullet characters into AI clients.
- **Privacy & placeholders**: Removed hardcoded personal name ("Prajyot Porje") from `SignupClient.tsx`, `StepIdentity.tsx`, and `SettingsClient.tsx`.

### 2026-09-10 — Auth verification hardening, login error differentiation & MCP SHA pipeline unification
- **Account status verification (`/api/auth/check-account`)**: Better Auth's internal credential sign-in purposely collapses non-existent users, wrong passwords, and social-only accounts into a single `INVALID_EMAIL_OR_PASSWORD` code to prevent timing attacks. To meet product requirements for clear user feedback, created `getAccountStatus` in `lib/db.ts` and `app/api/auth/check-account/route.ts` to inspect user/account state upon failed login, cleanly distinguishing "No account found with this email", "Incorrect password", and "Account registered with Google" without modifying core Better Auth adapters.
- **Unverified registration recovery**: Enhanced `SignupClient.tsx` so that users who closed their browser during OTP verification are not blocked by `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL` when attempting to register again; instead, they automatically receive a fresh code and advance to the verification step.
- **Google OAuth linking fix**: Added `requireLocalEmailVerified: false` to Better Auth's `accountLinking` configuration (`lib/auth.ts`). By default, Better Auth strictly blocks OAuth linking to unverified local users (`account not linked`), preventing Google sign-in from resolving pre-existing unverified accounts. Disabling this requirement for trusted provider `'google'` allows Google's verified identity to safely claim and verify the local account.
- **MCP SHA pipeline unification**: Added `sanitizeApiKey` in `lib/db.ts`, stripping quotes (`"..."`, `'...'`), decoding URI components, trimming `Bearer `, and explicitly rejecting masked bullet/asterisk characters. Refactored `app/api/mcp/health/route.ts` to call `validateApiKey` directly instead of maintaining duplicate SQL queries and hashing logic, resolving a critical reference error where `hash` was undefined.



### 2026-09-12 — Verified live RLS status; fixed double-slash MCP URL bug; removed filler docs
- **RLS verification (P0 of ROADMAP.md)**: `supabase/schema.sql` and this file both stated "no RLS policies exist" — that described the checked-in SQL, never verified against the live project. Checked directly: anon-key `GET` requests to `context_nodes`, `context_entries`, `context_edges`, `api_keys` all returned `[]` (RLS-on-zero-policies signature), while the same tables queried with the service-role key returned real rows. Confirms RLS was already enabled live with no policies — the safe state — it just wasn't reflected in code. Added explicit `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statements to `supabase/schema.sql` so a fresh project setup gets this by default instead of depending on a manually-clicked toggle, and corrected both docs. See §4 and §8 for the corrected reference text. Open follow-up: RLS-on-no-policy also applies to the realtime `postgres_changes` feed, so `GraphProvider`'s live subscription needs a functional check — may not be delivering updates over the anon key today.
- **Double-slash bug in displayed MCP URL**: `ConnectPageClient.tsx` and `SettingsClient.tsx` built the shown MCP URL as `${appUrl}/api/mcp`, where `appUrl` came straight from `NEXT_PUBLIC_APP_URL`. An env value with a trailing slash (`https://example.com/`) produced `https://example.com//api/mcp`. Added `getAppUrl()` to `lib/utils.ts` (strips trailing slashes) and switched both call sites and `app/connect/page.tsx` to use it instead of reading `process.env.NEXT_PUBLIC_APP_URL` directly.
- **Removed `project-docs/`**: the three PDF filler docs (problem statement, literature survey, presentation) were academic-assignment artifacts, not used by the app or its docs. Deleted.

### 2026-09-12 — Rate limiting, secret scrubbing, and the injection guard on save_context (P0 continued)
- **Rate limiting enforced**: `validateApiKey()` now returns `{ userId, apiKeyId, lastClientName }` instead of a bare string (call sites in `app/api/mcp/route.ts` and `app/api/mcp/health/route.ts` updated). New `checkRateLimit(apiKeyId)` in `lib/db.ts` enforces 300 requests/hour/key against `rate_limits`, called before any tool executes in `/api/mcp`. Read-then-write, not atomic under heavy concurrency — accepted tradeoff (see code comment) since the goal is stopping a single runaway/leaked key, not perfect accounting.
- **`rate_limits` added to the hand-maintained `Database` type** (`types/index.ts`) — it existed in the live DB (`scripts/migrate.ts`) but was never in the type, so `lib/db.ts` couldn't reference it without a `tsc` error. Exactly the drift §8 already warned about.
- **Secret scrubbing (P0.4)**: `scrubSecrets()` added to `lib/utils.ts` — pattern-based redaction (OpenAI-style keys, GitHub PATs, AWS access key IDs, PEM private key blocks, explicit `password:`/`token:`/etc. fields). Applied to `save_context`'s incoming `summary` before it reaches the judge, and again to the judge's own `entry`/`content_addition` output before persistence (defense in depth — the judge could echo a secret back even from already-scrubbed input).
- **Injection guard (P0.5)**: `save_context` no longer mutates `context_nodes.content` directly from model output. The `update_node_content`/`content_addition` path now writes a length-capped, scrubbed `[possible core update]`-prefixed row into `context_entries` instead — append-only and reviewable, not a permanent-storage mutation a hostile prompt-injected page could trigger. `judgment.entry` is now also length-capped (300 chars) before being persisted.

### 2026-09-12 — Phase 1 (ROADMAP.md): automatic capture, tool redesign, onboarding wall removed
Full phase — schema, MCP tools, background job, and the onboarding-gate change, all in one session:

- **Schema** (`scripts/migrate-phase1.ts`, run against the live project; `supabase/schema.sql` updated to match): `context_entries.kind` (`decision`/`preference`/`constraint`/`open_problem`/`resolved`/`note`, default `note`); new `staged_context_entries` table (RLS enabled, no policies, matching every other table); `api_keys.last_client_name`.
- **`lib/mcp-protocol.ts` added**: the standing memory-protocol text, `get_context`'s bootstrap-detection reply builder, and the batch-judge prompt builder all live here as pure functions, imported by both `app/api/mcp/route.ts` and `app/api/cron/process-staged/route.ts`. Pulled out specifically so this logic is unit-testable (see §9) and so the "what's worth keeping" rule has exactly one definition instead of two copies drifting apart.
- **MCP tool surface rewritten**: `get_context(scope?)` (scope now optional, defaults `me`), `remember(text, kind?, scope?)`, `recall(query)`, `resolve(entry_id)`, `forget(entry_id)`, `list_nodes()`. `save_context` still handled server-side (any client that already cached it from `tools/list` keeps working) but dropped from `tools/list` — not advertised to new sessions.
- **Two-stage save**: `remember` calls `stageEntry()` (cheap dedupe against pending-queue and last-24h `context_entries`, no LLM) and returns immediately. `app/api/cron/process-staged` (new Vercel cron, `*/5 * * * *`) batches up to 20 staged rows into one `judgeContext()` call, applies a per-user bootstrap-leniency flag (fewer than 5 existing entries → keep almost everything), writes kept items into `context_entries` with a `kind`, and deletes every processed row regardless of outcome. Chosen specifically so no chat response ever blocks on an LLM call — see ROADMAP.md P1.4 for the reasoning this was built against (a judge-per-tool-call design was rejected up front for reintroducing per-message latency and cost).
- **Reliability move**: the save decision is no longer the model's judgment call. `remember`'s instruction is mechanical — "when in doubt, call it, the server decides" — deliberately trading precision on the client side for reliability, since a coarse instruction is far more consistently followed across different MCP clients than an instruction asking the model to weigh importance itself.
- **`instructions` on `initialize`, imperative tool descriptions, and `get_context` protocol text** — three separate places carrying the same rule, because client support for the MCP `instructions` field is inconsistent; whichever slot a given client actually reads, the rule still lands.
- **Client-name capture**: `initialize`'s `params.clientInfo.name` is persisted to `api_keys.last_client_name` (fire-and-forget) since MCP only sends `clientInfo` on `initialize`, not later calls — this is how a later `remember` call on the same key still gets tagged with a `source` (falls back to `User-Agent` if never set).
- **Tool-call logging**: every tool call now logs `tool=... client=...` to the console (`logToolCall()`) — not a dashboard, just Vercel's log stream, laid down now so save-worthy-moments-vs-actual-calls can be measured later per ROADMAP.md P1.7.
- **Onboarding wall removed**: `onboarding_done` changed meaning from "completed the wizard" to "connected at least one tool," set by `markOnboardingDone()` inside the `initialize` handler. `proxy.ts` no longer redirects unfinished-onboarding users into `/onboarding`, nor redirects away from it based on `onboarding_done` (that flag can no longer distinguish "wizard done" from "tool connected," so it can't safely gate the wizard page either — the page's own `redirect('/dashboard')` on `onboarding_done` was removed for the same reason). `SignupClient.tsx` now routes to `/connect` after email verification instead of `/onboarding`. The wizard itself (`OnboardingWizard.tsx`, `/api/onboarding/finalize`) is untouched and still fully functional — linked from `/connect` as an optional "answer a few questions instead" path rather than a forced gate.
- **Testing**: Vitest added (`npm test`), scoped to the logic above — see new §9. 35 tests, all passing; full-project `tsc --noEmit` and `eslint .` both clean at time of writing (4 pre-existing `<img>` warnings, unrelated).
- **Known follow-ups, deliberately not addressed here**: P2.3 (fuzzy dedupe/supersede — today's dedupe is exact-text-match only, so near-duplicate phrasing of the same fact will both get saved); real semantic search for `recall` (today it's `ILIKE` substring matching, fine at low volume, called out in both code and ROADMAP.md P3 as the planned upgrade); the DB-observed connection-pool exhaustion (`EMAXCONNSESSION`, Better Auth's session lookup) and an `/api/onboarding/finalize` JSON-parse fallback both surfaced in dev-server logs during this session from what looks like separate manual testing traffic — neither is caused by this session's changes, neither was investigated or fixed here, flagged for follow-up.

### 2026-09-13 — process-staged cron failed to deploy on Vercel Hobby; moved to after()-triggered draining
Deploying yesterday's `*/5 * * * *` cron for `/api/cron/process-staged` failed: Vercel's Hobby plan only allows cron jobs to run once per day, and rejects more frequent schedules at deploy time rather than degrading gracefully. Since Hobby is the plan actually in use, the every-5-minutes design from 2026-09-12 was not viable as built.

Fix: extracted the batch-judging logic out of the cron route into `lib/process-staged.ts` (`processStagedBatch()`, plus a fire-and-forget `triggerBackgroundDrain()` wrapper). Primary triggering moved off the clock entirely — `app/api/mcp/route.ts`'s `get_context` and `remember` handlers both call `triggerBackgroundDrain()` via Next.js's `after()`, which runs after the response has already been sent, so it adds zero latency to any chat reply and drains on real MCP traffic instead of a schedule. `app/api/cron/process-staged/route.ts` is now a thin wrapper calling the same function, kept only as a once/day (`0 3 * * *`) safety net for a user who stages an entry and never makes another MCP call.

This is actually a better fit for the goal than the original cron design: draining now happens as often as the app is actually used (every `get_context`/`remember` call) rather than on a fixed 5-minute clock, and it required no infrastructure Hobby doesn't already provide. Accepted trade-off: two `after()` drains firing near-simultaneously (concurrent requests) could both claim the same pending rows, since the judge-then-delete order isn't locked — worst case is a duplicate `context_entries` row (P2.3's planned fuzzy dedupe cleans this up), never data loss or corruption. Not worth a locking column for a low-probability, low-severity race at this stage.

Added `lib/process-staged.test.ts` (6 tests) covering `processStagedBatch()`'s branching now that it's an importable module — this logic was previously untested since it lived inline in a Next.js route file.


### 2026-10-30 — Guided demo recovery, reviewed imports and OAuth

Supersedes the September empty-dashboard/wizard and API-key-only setup decisions. New/empty accounts enter guided setup; readiness comes from real saved context, not onboarding_done. Removed the destructive legacy wizard and retired parser/finalize routes with HTTP 410. Added revisioned, expiring import drafts and atomic additive commits. Connecting alone never saves memories or rotates keys.

Brought minimal OAuth forward from roadmap P5 because ChatGPT cannot use custom API-key headers. Pinned Better Auth/provider 1.7.14, added provider/JWKS schema, signed continuation/consent, discovery, PKCE, resource-bound scopes, refresh and disconnect revocation. Replaced manual MCP transport with official SDK 1.32.2. Header API keys remain; query credentials are retired.

Replaced application Supabase REST queries with typed server-side pg helpers and a shared bounded pool to support row locks, transactions, queue leases and consistent tenant isolation. Better Auth remains identity authority; no Supabase Auth/RLS bridge was added. parent_scope is canonical and edges are derived/rebuilt. Added source/dedupe metadata, bounded retries, atomic processing, queue/capture status and account request limits. get_context now includes active saved entries. Authenticated refresh replaces anon realtime blocked by RLS.

Added checked-in schema snapshots, additive SQL and a dry-run-first provider migration runner. Added isolated real-Postgres and browser fixtures. Updated Next.js to 16.4.3 and related tooling after dependency audit; removed unused onboarding driver. Restricted Tailwind discovery and opt-in Agentation. Locked DESIGN.md tokens were preserved. No production migration or deployment was applied; hosted client and Google account verification are release checks.

### 2026-10-30 — Production upgrade: legacy uniqueness invariants

The first live reviewed-import smoke test exposed schema drift absent from fresh test databases: production lacked unique indexes on context_nodes(user_id, scope) and api_keys(user_id), which typed upserts require. Added a separate non-destructive dated migration, wired it into the upgrade runner/snapshot, and added a regression test that removes the fresh-install constraints before upgrading and exercising import/key replacement. Historic duplicates are never deleted automatically; index creation fails for review if any exist. Release verification must exercise actual upserts on the restored legacy schema, not only apply DDL and compare row counts.
