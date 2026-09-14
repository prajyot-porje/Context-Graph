# ContextGraph — Architecture

Version 1.0 | Established 2026-09-05

This is the technical source of truth: how ContextGraph is actually built today, and why it evolved that way. It is not the product spec (see [PRODUCT.md](PRODUCT.md)) and not the visual spec (see [DESIGN.md](DESIGN.md)). Agent workflow rules and skill usage live in [AGENTS.md](AGENTS.md).

## How to use this file

- Read this before touching auth, database schema, the MCP endpoint, API routes, or any cross-cutting `lib/` module — and before adding or removing a dependency.
- This file has two parts: a **current-state reference** (sections 1–9) and an **append-only Architecture Log** (bottom). The reference describes what's true *now*. The log describes *how we got here* and *why*.
- Every architectural decision — new table, new external service, an auth-model change, a structural refactor, deleting/replacing a core module, a deviation from the original plan — gets a new dated entry appended to the log. Never rewrite past log entries; if a decision is later reversed, log the reversal as a new entry and update the current-state reference above it.
- Log entries dated before 2026-09-05 are reconstructed from git history and prior docs (no original log existed) — treat their dates as approximate. Everything from 2026-09-05 onward is exact.

---

## 1. System Overview

Next.js App Router monolith. One deployment (Vercel) serves the marketing site, the authenticated web app, and the MCP endpoint that external AI clients call. Supabase Postgres is the only datastore. Better Auth owns identity. There is no separate backend service — see §6 for why this matters (it resolves a doc inconsistency that existed before 2026-09-05).

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router), TypeScript strict | |
| Hosting | Vercel | single deployment, includes the MCP endpoint |
| Auth | Better Auth v1.6 | owns `user`/`session`/`account`/`verification` tables |
| Database | Supabase Postgres, `pg` driver | server-side only, service-role key |
| Realtime | Supabase Realtime (`@supabase/ssr` browser client, anon key) | node/edge tables replicated, see §4 |
| Graph rendering | `react-force-graph-3d` (Three.js/WebGL) | not React Flow — see log, 2026-06 |
| Scroll | Lenis, synced to GSAP's RAF loop | |
| Animation | GSAP + ScrollTrigger + CustomEase | no CSS keyframes for entrances |
| AI judgment | `openai` SDK pointed at OpenRouter, plus a direct Gemini call | model-cascade fallback, see §7 |
| Styling | Tailwind CSS v4 + CSS custom properties | tokens defined in DESIGN.md |

## 3. Directory Conventions

```text
/app
  /(marketing)/page.tsx          → actually app/page.tsx (no route group in practice)
  /(auth)/login/page.tsx
  /(auth)/signup/page.tsx
  /(app)/dashboard/page.tsx
  /(app)/onboarding/page.tsx
  /(app)/settings/page.tsx
  /connect/page.tsx
  /api/auth/[...all]/route.ts
  /api/context/route.ts
  /api/context/[id]/route.ts
  /api/context/[id]/entries/route.ts
  /api/context/preview/route.ts
  /api/apikey/route.ts
  /api/mcp/route.ts
  /api/mcp/health/route.ts
  /api/onboarding/chat/route.ts
  /api/onboarding/finalize/route.ts
  /api/cron/decay/route.ts
  /api/cron/process-staged/route.ts    → daily safety-net cron only; see lib/process-staged.ts (added 2026-09-12, corrected 2026-09-13)

/components
  /graph        → ContextGraph3D.tsx (live)
  /landing      → marketing sections
  /dashboard    → shell, sidebar, node panels, settings client
  /onboarding   → step-wizard onboarding flow (StepIdentity/Stack/Projects/Goals/Review, MemoryImportStep, GraphPreview)
  /auth         → login/signup client components
  /connect      → MCP connection setup UI
  /providers    → GraphProvider (realtime), LenisProvider
  /ui           → design-system atoms

/lib
  /auth.ts, /auth/server.ts, /auth-client.ts   → Better Auth config + session helpers
  /db.ts                                        → all Supabase reads/writes, user-scoped
  /supabase.ts, /supabase/client.ts             → server + browser Supabase clients
  /context.ts                                    → assembleContext (core graph→text logic)
  /graph-utils.ts                                → depth/tree/sort helpers for the UI
  /openrouter.ts                                  → AI judgment cascade
  /mcp-protocol.ts                               → MCP protocol text + prompt builders (added 2026-09-12, see §6)
  /process-staged.ts                             → batches + judges staged_context_entries (added 2026-09-13, see §6)
  /api/errors.ts                                  → error → HTTP status mapping
  /logging.ts                                     → OpenRouter call logging

/types        → hand-maintained interfaces + Supabase Database type (see §8 debt)
proxy.ts      → route protection. Next.js 16 renamed the `middleware.ts`/`middleware()`
                convention to `proxy.ts`/`proxy()` — the old name still "works" but only
                runs in the (here, incompatible) edge runtime. Do NOT rename this to
                middleware.ts. See log, 2026-09-05, for a correction of an earlier mistake.
```

## 4. Data Model

Better Auth owns `user` (extended with a custom `onboarding_done` boolean), `session`, `account`, `verification`. App tables:

**`context_nodes`** — `id` (uuid), `user_id` (fk → user), `scope` (text, e.g. `me`, `agency`, `personal/project-slug`), `title`, `content` (markdown injected into AI context), `relevance` (float 0–1), `tags` (text[]), `parent_scope` (nullable text), `last_updated`, `created_at`.

**`context_edges`** — `id`, `user_id`, `source_node_id` → `target_node_id` (both fk → context_nodes), `edge_type` (default `part_of`), `created_at`. Unique on `(source_node_id, target_node_id)`.

**`context_entries`** — `id`, `node_id` (fk, cascade delete), `user_id`, `entry_text`, `score` (float), `kind` (added 2026-09-12: `decision` | `preference` | `constraint` | `open_problem` | `resolved` | `note`, default `note`), `created_at`. The "decisions log" per node. `resolve`/`forget` (MCP tools, §6) update/delete rows here directly.

**`staged_context_entries`** (added 2026-09-12) — `id`, `user_id`, `raw_text`, `kind_hint`, `scope_hint`, `source`, `created_at`. Write-only landing zone for the `remember` MCP tool (§6); drained and deleted by `processStagedBatch()` (`lib/process-staged.ts`). Never read by the app UI.

**`api_keys`** — `id`, `user_id` (fk, unique — one active key per user), `key_hash` (SHA-256, unique), `key_prefix` (first 12 chars, shown in UI), `created_at`, `last_used`, `last_client_name` (added 2026-09-12 — see §6).

**`rate_limits`** — `id`, `api_key_id` (fk → api_keys), `window_start`, `request_count`. **Enforced as of 2026-09-12** — `checkRateLimit()` in `lib/db.ts` reads and writes this table on every `/api/mcp` request; 300 requests/hour/key, see §5 and §6.

Realtime: `context_nodes`, `context_entries`, `context_edges` all have `REPLICA IDENTITY FULL` and are added to the `supabase_realtime` publication so `GraphProvider` can subscribe to live changes from the browser (anon key).

**Corrected 2026-09-12:** the "no RLS exists" note below was wrong — it described the repo's checked-in SQL, not the live project, and nobody had verified the two matched. Verified directly against the live project: RLS is **enabled** on `context_nodes`, `context_entries`, `context_edges`, and `api_keys`, with zero policies attached — confirmed by anon-key requests returning `[]` (RLS-on-no-policy behavior) rather than a permission error (RLS-off-no-grant behavior) on all four tables, while a service-role query against the same tables returned real rows. `supabase/schema.sql` now carries explicit `ENABLE ROW LEVEL SECURITY` statements so the checked-in schema matches reality and survives a fresh project setup. See log, 2026-09-12.

Consequence worth knowing: RLS-enabled-with-no-policies also blocks the anon key from the realtime `postgres_changes` feed described above, since Realtime evaluates the same policies for the subscribing role. `GraphProvider`'s live subscription may not actually be delivering updates today — this needs a functional check (open two sessions, edit a node in one, watch for the update in the other), separate from the security verification above.

## 5. Auth Architecture

Two independent schemes, deliberately not bridged:

1. **Web session** — Better Auth cookie, 7-day expiry, 5-minute cookie cache. `requireSessionUser()` resolves the user server-side; throws `'Unauthorized'` (string-matched in `lib/api/errors.ts` → 401) if absent.
2. **MCP clients** — `x-api-key` header or `?key=` query param. Server hashes the incoming key (SHA-256) and looks it up in `api_keys`. No cookies, no CSRF surface for this path. Every `/api/mcp` request is also rate-limited (`checkRateLimit()`, `lib/db.ts`) against `rate_limits` — 300 requests/hour/key, read-then-write (not atomic under heavy concurrency; deliberate, see log 2026-09-12) — before any tool executes.

Both paths converge on the same rule: every `lib/db.ts` function takes a `userId` and filters by it explicitly. This is programmatic tenant isolation, not database-level RLS — deliberate, see log 2026-05-08. (RLS is *also* independently enabled with no policies as a backstop against the anon key specifically — see §4 — but authorization here never depends on it.)

Route protection: `proxy.ts` (Next.js 16's route-protection convention — see log, 2026-09-05, for a correction: this was briefly and incorrectly renamed to `middleware.ts` during an earlier audit) redirects unauthenticated visitors away from `/dashboard`, `/settings`, `/onboarding`, `/connect`. **Corrected 2026-09-12:** it no longer redirects based on `onboarding_done`, in either direction — see §6 and log for why. This is the only route-level guard for `/dashboard` and `/settings`; those two pages have no additional per-page `requireSessionUser()` check, so if the proxy's matcher config ever breaks, those pages currently have no fallback guard. Worth adding one if this becomes a repeated failure mode.

## 6. MCP Endpoint

`app/api/mcp/route.ts` is a JSON-RPC 2.0 Streamable HTTP endpoint: `initialize`, `notifications/initialized`, `tools/list`, `tools/call`. `app/api/mcp/health/route.ts` is a separate lightweight health check, same auth. CORS is open (`Access-Control-Allow-Origin: *`) since external desktop/web AI clients call it cross-origin.

**Tools (rewritten 2026-09-12, see log for the full rationale):** `get_context(scope?)`, `remember(text, kind?, scope?)`, `recall(query)`, `resolve(entry_id)`, `forget(entry_id)`, `list_nodes()` (omits `content` to save tokens). `save_context(summary, scope, goal, achieved)` still works but is no longer advertised in `tools/list` — kept only for any client that already discovered/cached it.

`remember` never calls an LLM on the request path — it does cheap dedupe (`stageEntry()` in `lib/db.ts`) and writes to `staged_context_entries`, returning immediately. `processStagedBatch()` (`lib/process-staged.ts`) judges up to 20 staged rows in a single LLM call, writes the kept ones into `context_entries` with a `kind`, and deletes all processed rows (kept or dropped) so the staging table never grows unbounded. This exists specifically so no chat response ever waits on an LLM call to save something (see ROADMAP.md P1.4 for the reasoning — the two-stage split is load-bearing, not incidental).

**Corrected 2026-09-13:** this was originally triggered by a Vercel cron running every 5 minutes. That failed at deploy time — Vercel's Hobby plan rejects any cron schedule more frequent than once/day (`*/5 * * * *` errors out during deployment, it doesn't silently degrade). Fixed by moving primary triggering off the clock entirely: both the `get_context` and `remember` MCP handlers call `processStagedBatch()` via Next.js's `after()` (`triggerBackgroundDrain()` in `lib/process-staged.ts`) — which runs *after* the response is already sent, so it adds no latency to a chat reply, and it drains on real traffic instead of a schedule. `app/api/cron/process-staged` still exists, now scheduled once/day (`vercel.json`), purely as a safety net for a user who stages something and never triggers another MCP call again. Trade-off accepted: two `after()` drains firing at nearly the same moment (concurrent requests) could both grab the same pending rows and double-process them — the judge-then-delete order means the worst case is a duplicate `context_entries` row, not data loss or corruption, and P2.3's planned fuzzy dedupe cleans this up anyway. Not worth a locking column for a low-probability, low-severity race at this stage.

`initialize` also does two side effects, both fire-and-forget: it persists `params.clientInfo.name` onto the `api_keys` row (`last_client_name`) since MCP only sends `clientInfo` on `initialize`, not on later calls — this is how `remember`/`recall`/etc. still get a `source` to tag entries with — and it calls `markOnboardingDone(userId)`, since a successful MCP handshake is now what "onboarded" means (see below).

`initialize`'s response also carries an `instructions` field, and `get_context`'s reply appends a standing protocol block (with a bootstrap variant when the graph is new/sparse) — both defined once in `lib/mcp-protocol.ts` and reused by the cron job's batch-judge prompt, so the "what's worth keeping" rule only lives in one place. See ROADMAP.md P1.1–P1.4 for why three separate slots carry the same rule (client support for `instructions` is inconsistent) and why the save decision moved server-side (a mechanical "always call, when in doubt" instruction is more reliable across clients than asking the model to judge importance itself).

**Onboarding wall removed:** `onboarding_done` no longer means "completed the wizard" — it means "connected at least one tool," set by the `initialize` handler above. `proxy.ts` no longer redirects into `/onboarding` when it's false, `SignupClient.tsx` routes straight to `/connect` after verification, and the wizard page itself no longer redirects away when `onboarding_done` is true (it can't gate on that anymore, since connecting a tool sets it before someone might still want to run the wizard). The wizard (`OnboardingWizard.tsx`, `/api/onboarding/finalize`) still exists and works, linked as an optional shortcut from `/connect` — "answer a few questions instead."

**Deployment reality (corrected 2026-09-05):** this Next.js app, deployed on Vercel, is the only real MCP server. There is no separate Railway service and no Cloudflare Worker MCP server — prior docs and `SettingsClient.tsx` referenced a `your-cf-worker.workers.dev` placeholder (and a separate `your-app.vercel.app` placeholder) for some client snippets; both were stale/aspirational and have been corrected to use `NEXT_PUBLIC_APP_URL` so the snippet always matches wherever this app is actually deployed. `ConnectPageClient.tsx` already did this correctly (via an `appUrl` prop) and needed no change. If a separate edge-deployed MCP server is ever actually built, log that decision here when it happens — don't just update a UI snippet again.

## 7. AI Judgment Layer

`lib/openrouter.ts` implements a fallback cascade for `save_context` judgment calls: a direct Gemini call first, then OpenRouter models in order, retrying on transient errors (`402/404/429/502/503`) and aborting immediately on non-transient ones (auth, bad request). The judgment prompt evaluates whether a session summary is worth permanently saving (goal achieved, factual/architectural significance, filters out trivial progress), returns `{ should_save, reason, entry, score, target_scope }`. If accepted: writes `context_entries`, bumps the node's `relevance` (clamped to 1.0).

`judgeContext()` is also reused by `/api/onboarding/finalize` (see log, 2026-09-06) to turn structured onboarding-wizard answers into rich node `content` prose — a much smaller, more reliable prompt than the earlier chat-transcript-parsing approach it replaced.

## 8. Known Architecture Debt

Track items here; when one is fixed, add a dated log entry below and remove it from this list (don't just delete the learning).

- No checked-in SQL migrations folder — schema currently lives across `types/index.ts`'s hand-maintained `Database` type and two ad-hoc scripts (`scripts/migrate.ts`, `scripts/migrate-edges.ts`). Risk of drift between the type and the live DB. *(Partially addressed 2026-09-05 — see log; a checked-in schema snapshot now exists under `supabase/schema.sql`, but it's still not a real migration framework.)*
- Two parallel hierarchy representations: `parent_scope` (string field) and `context_edges` (join table). `PATCH /api/context/[id]` can change `parent_scope` without updating the corresponding edge row — they can silently drift.
- ~~`rate_limits` table exists, nothing uses it. No rate limiting is enforced on `/api/mcp` today.~~ **Fixed 2026-09-12** — see §4, §5, §6, and log.
- ~~No RLS policies found in-repo; realtime subscriptions run over the anon key. Needs verification against the live Supabase project.~~ **Verified and fixed 2026-09-12** — see §4 and log. RLS was already enabled live with no policies (safe); the checked-in schema now matches. Follow-up open: confirm whether `GraphProvider`'s realtime subscription still delivers updates now that RLS applies to the anon role on the realtime feed too.
- Settings → Account tab: hardcoded placeholder values, "Save" is a no-op toast with no API call. Danger Zone delete button has no handler and no backing route — account deletion isn't implemented. *(Not yet fixed — needs a real `PATCH`/`DELETE` account route plus wiring.)*
- `/dashboard` and `/settings` still have no per-page `requireSessionUser()` guard as a fallback behind `proxy.ts` — acceptable given `proxy.ts` runs correctly (see log, 2026-09-05 correction), but worth adding if its matcher config ever silently breaks.
- The dev-only `Agentation` overlay (`components/providers/LenisProvider.tsx`, gated to `NODE_ENV === 'development'`) installs a global keydown listener that can swallow Enter/comma keystrokes app-wide while `npm run dev` is running (observed while testing the onboarding wizard's tag input — the `onBlur` commit path is unaffected). Harmless in production since it's dev-gated, but worth knowing if a keyboard shortcut mysteriously doesn't fire during local development.
- **New 2026-09-12:** `rate_limits` rows are never pruned — one row per API key per hour-window, forever. Not urgent (tiny rows, one per key), but worth a cleanup cron eventually.
- ~~The `/api/cron/process-staged` schedule (`*/5 * * * *` in `vercel.json`) assumes frequent cron execution. Verify this actually runs at that cadence on whatever Vercel plan is deployed.~~ **Fixed 2026-09-13** — this assumption was wrong: Vercel Hobby rejects sub-daily cron schedules at deploy time, it doesn't just run imprecisely. Primary draining moved to Next.js `after()` triggered by real MCP traffic; the cron is now a once/day safety net only. See §6 and log.
- If `judgeContext()` fails repeatedly (both Gemini and the OpenRouter cascade down), `processStagedBatch()` leaves the whole batch staged for retry rather than dropping it — correct for not losing data. Retries now happen far more often than before (every `get_context`/`remember` call, not just once/day), so this matters less than it did, but there's still no cap on how long a batch can sit retrying, nor alerting if it does.

## 9. Testing

Added 2026-09-12 (see ROADMAP.md's testing guidance: unit-test what's stable now, grow E2E/load tests alongside each phase's own code rather than as a catch-up project at the end). `npm test` runs Vitest (`vitest.config.mts`, `*.test.ts` colocated with source).

Scope deliberately narrow so far — security-critical and newly-stable logic, not the UI or the parts of the MCP tool surface still expected to change shape in P2/P3:

- `lib/utils.test.ts` — `scrubSecrets` (P0.4 pattern matching), `getAppUrl` (trailing-slash normalization).
- `lib/db.test.ts` — `sanitizeApiKey` (pure), plus `checkRateLimit` / `stageEntry` / `resolveEntry` / `forgetEntry` against a minimal hand-rolled fake Supabase query builder (`vi.mock('@/lib/supabase')`, queued per-call results). That fake verifies branching logic (duplicate/over-limit/error handling), not the exact query shape sent to Supabase — a real integration test against a test database would be needed to catch a wrong `.eq()` column, and doesn't exist yet.
- `lib/mcp-protocol.test.ts` — `buildGetContextReply`'s bootstrap-detection threshold and `buildBatchJudgePrompt`'s formatting, both pulled out of the two MCP route files specifically so they'd be unit-testable (see log).
- `lib/process-staged.test.ts` — `processStagedBatch()`'s branching (empty queue, invalid/mismatched judge response left staged for retry, kept-vs-dropped writes, unknown `kind` falling back to `note`, a kept item with no matching node skipping cleanly), against `@/lib/db` and `@/lib/openrouter` mocked with `vi.mock`.

No Playwright/E2E and no load testing yet — intentionally deferred. P1.6 (this session) already changed the onboarding/connect flow once; per ROADMAP.md, E2E coverage is worth adding once that UI settles rather than locking in behavior that's still likely to shift again, and load testing is deferred to after P5 (OAuth), since that's when the request pattern actually changes shape.

---

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
