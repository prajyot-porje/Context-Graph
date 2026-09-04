# ContextGraph — Architecture

Version 1.0 | Established 2026-09-05

This is the technical source of truth: how ContextGraph is actually built today, and why it evolved that way. It is not the product spec (see [PRODUCT.md](PRODUCT.md)) and not the visual spec (see [DESIGN.md](DESIGN.md)). Agent workflow rules and skill usage live in [AGENTS.md](AGENTS.md).

## How to use this file

- Read this before touching auth, database schema, the MCP endpoint, API routes, or any cross-cutting `lib/` module — and before adding or removing a dependency.
- This file has two parts: a **current-state reference** (sections 1–8) and an **append-only Architecture Log** (bottom). The reference describes what's true *now*. The log describes *how we got here* and *why*.
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

/components
  /graph        → ContextGraph3D.tsx (live)
  /landing      → marketing sections
  /dashboard    → shell, sidebar, node panels, settings client
  /onboarding   → conversational onboarding flow
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
  /api/errors.ts                                  → error → HTTP status mapping
  /logging.ts                                     → OpenRouter call logging

/types        → hand-maintained interfaces + Supabase Database type (see §8 debt)
middleware.ts → route protection (was proxy.ts — fixed 2026-09-05, see log)
```

## 4. Data Model

Better Auth owns `user` (extended with a custom `onboarding_done` boolean), `session`, `account`, `verification`. App tables:

**`context_nodes`** — `id` (uuid), `user_id` (fk → user), `scope` (text, e.g. `me`, `agency`, `personal/project-slug`), `title`, `content` (markdown injected into AI context), `relevance` (float 0–1), `tags` (text[]), `parent_scope` (nullable text), `last_updated`, `created_at`.

**`context_edges`** — `id`, `user_id`, `source_node_id` → `target_node_id` (both fk → context_nodes), `edge_type` (default `part_of`), `created_at`. Unique on `(source_node_id, target_node_id)`.

**`context_entries`** — `id`, `node_id` (fk, cascade delete), `user_id`, `entry_text`, `score` (float), `created_at`. The "decisions log" per node.

**`api_keys`** — `id`, `user_id` (fk, unique — one active key per user), `key_hash` (SHA-256, unique), `key_prefix` (first 12 chars, shown in UI), `created_at`, `last_used`.

**`rate_limits`** — `id`, `api_key_id` (fk → api_keys), `window_start`, `request_count`. Table exists, is created by `scripts/migrate.ts`, and **is not read or written by any route** — no rate limiting is actually enforced today. Scaffolded, not implemented.

Realtime: `context_nodes`, `context_entries`, `context_edges` all have `REPLICA IDENTITY FULL` and are added to the `supabase_realtime` publication so `GraphProvider` can subscribe to live changes from the browser (anon key).

Known gap: no RLS policies exist in this repo. The browser realtime subscription uses the anon key; if the live Supabase project has no RLS configured, that subscription is only as safe as whatever filter is applied client-side. Verify directly against the Supabase project, this can't be confirmed from code alone.

## 5. Auth Architecture

Two independent schemes, deliberately not bridged:

1. **Web session** — Better Auth cookie, 7-day expiry, 5-minute cookie cache. `requireSessionUser()` resolves the user server-side; throws `'Unauthorized'` (string-matched in `lib/api/errors.ts` → 401) if absent.
2. **MCP clients** — `x-api-key` header or `?key=` query param. Server hashes the incoming key (SHA-256) and looks it up in `api_keys`. No cookies, no CSRF surface for this path.

Both paths converge on the same rule: every `lib/db.ts` function takes a `userId` and filters by it explicitly. This is programmatic tenant isolation, not database-level RLS — deliberate, see log 2026-05-08.

Route protection: `middleware.ts` (see log, 2026-09-05 — previously a dead file named `proxy.ts`) redirects unauthenticated visitors away from `/dashboard`, `/settings`, `/onboarding`, `/connect`, and redirects based on `onboarding_done`. This is the only route-level guard for `/dashboard` and `/settings`; those two pages have no additional per-page `requireSessionUser()` check, so if middleware config or matcher ever breaks, those pages currently have no fallback guard. Worth adding one if this becomes a repeated failure mode.

## 6. MCP Endpoint

`app/api/mcp/route.ts` is a JSON-RPC 2.0 Streamable HTTP endpoint: `initialize`, `notifications/initialized`, `tools/list`, `tools/call`. Three tools: `get_context(scope)`, `save_context(summary, scope, goal, achieved)`, `list_nodes()` (omits `content` to save tokens). CORS is open (`Access-Control-Allow-Origin: *`) since external desktop/web AI clients call it cross-origin. `app/api/mcp/health/route.ts` is a separate lightweight health check, same auth.

**Deployment reality (corrected 2026-09-05):** this Next.js app, deployed on Vercel, is the only real MCP server. There is no separate Railway service and no Cloudflare Worker MCP server — prior docs and `SettingsClient.tsx` referenced a `your-cf-worker.workers.dev` placeholder (and a separate `your-app.vercel.app` placeholder) for some client snippets; both were stale/aspirational and have been corrected to use `NEXT_PUBLIC_APP_URL` so the snippet always matches wherever this app is actually deployed. `ConnectPageClient.tsx` already did this correctly (via an `appUrl` prop) and needed no change. If a separate edge-deployed MCP server is ever actually built, log that decision here when it happens — don't just update a UI snippet again.

## 7. AI Judgment Layer

`lib/openrouter.ts` implements a fallback cascade for `save_context` judgment calls: a direct Gemini call first, then OpenRouter models in order, retrying on transient errors (`402/404/429/502/503`) and aborting immediately on non-transient ones (auth, bad request). The judgment prompt evaluates whether a session summary is worth permanently saving (goal achieved, factual/architectural significance, filters out trivial progress), returns `{ should_save, reason, entry, score, target_scope }`. If accepted: writes `context_entries`, bumps the node's `relevance` (clamped to 1.0).

`generateContextGraph()` in the same file builds the *old* form-based onboarding prompt — superseded by the conversational onboarding flow (`/api/onboarding/chat` + `/api/onboarding/finalize`), see log 2026-07. Not currently called by the frontend.

## 8. Known Architecture Debt

Track items here; when one is fixed, add a dated log entry below and remove it from this list (don't just delete the learning).

- No checked-in SQL migrations folder — schema currently lives across `types/index.ts`'s hand-maintained `Database` type and two ad-hoc scripts (`scripts/migrate.ts`, `scripts/migrate-edges.ts`). Risk of drift between the type and the live DB. *(Partially addressed 2026-09-05 — see log; a checked-in schema snapshot now exists under `supabase/schema.sql`, but it's still not a real migration framework.)*
- Two parallel hierarchy representations: `parent_scope` (string field) and `context_edges` (join table). `PATCH /api/context/[id]` can change `parent_scope` without updating the corresponding edge row — they can silently drift.
- `rate_limits` table exists, nothing uses it. No rate limiting is enforced on `/api/mcp` today.
- No RLS policies found in-repo; realtime subscriptions run over the anon key. Needs verification against the live Supabase project.
- Settings → Account tab: hardcoded placeholder values, "Save" is a no-op toast with no API call. Danger Zone delete button has no handler and no backing route — account deletion isn't implemented. *(Not yet fixed — needs a real `PATCH`/`DELETE` account route plus wiring.)*
- `/dashboard` and `/settings` still have no per-page `requireSessionUser()` guard as a fallback behind `middleware.ts` — acceptable now that middleware actually runs (see log), but worth adding if middleware config ever silently breaks again.

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

### 2026-09-05 — `proxy.ts` → `middleware.ts`
Route-protection logic existed but Next.js only auto-loads middleware from a file literally named `middleware.ts` (or `src/middleware.ts`), exporting a function named `middleware` (or default export). The file was named `proxy.ts` and exported a function named `proxy` — silently never executed. Renamed the file and the exported function. This was the single highest-impact bug found in the initial project audit: `/dashboard` and `/settings` were reachable without a session and without an onboarding-completion check.

### 2026-09-05 — MCP deployment documentation corrected
Confirmed with the project owner: there is no separate Railway or Cloudflare Worker MCP deployment. This Next.js app, deployed on Vercel, is the only real MCP server (`/api/mcp`). Removed the stale "deployed separately on Railway" claim from AGENTS.md and fixed `SettingsClient.tsx`, which hardcoded a placeholder Cloudflare Worker URL (and a placeholder Vercel domain) in its connection snippets — both now derive from `NEXT_PUBLIC_APP_URL`.

### 2026-09-05 — Dead code removed
Deleted `lib/mock-data.ts`, `lib/mock-entries.ts`, `components/graph/ContextGraph.tsx` (2D, superseded), `components/dashboard/CreateNodeDialog.tsx` (duplicate of `AddNodeModal.tsx`), `app/api/onboarding/route.ts` and `generateContextGraph()` in `lib/openrouter.ts` (superseded by the chat+finalize flow), `lib/supabase.ts`'s unused `createSupabaseBrowser`, and the now-unused `OnboardingAnswers` type. Also removed `test.css` (stray Tailwind build output, not imported anywhere) and stopped tracking `.impeccable/live/config.json` (local dev-tool session state — kept on disk, added to `.gitignore`).

### 2026-09-05 — Checked-in schema snapshot added
Added `supabase/schema.sql` reflecting the actual live schema (reverse-engineered from `types/index.ts`'s `Database` type plus `scripts/migrate.ts` and `scripts/migrate-edges.ts`), so the schema has one readable source instead of three scattered ones. This is a snapshot, not a migration framework — future schema changes should still add a new dated SQL file (or adopt a real migration tool) and get logged here, not just edit the snapshot silently.
