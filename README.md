# ContextGraph

Personal context shared across AI tools through an authenticated MCP server. A new account sees guided setup, not an empty graph.

## The working flow

Sign in → choose Claude or ChatGPT → configure the connector → copy the setup prompt → review and approve facts in the client → review/edit the received draft in ContextGraph → save → dashboard.

Connecting does not expose a client's native memories to our server. The client proposes information available in its conversation; no complete export is promised. Imports are drafts until saved on the website. A compact manual context editor and line-based paste/export path are available when a client has no useful memories or cannot connect. Existing accounts with meaningful context open the dashboard directly.

## Development

Use Node.js 22.13+ (or current Node.js 24 LTS), npm, and a Supabase PostgreSQL database. Better Auth owns identity; app queries run on the server through typed pg helpers in lib/db.ts. No browser access to private Supabase tables is needed.

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local` and supply your database, auth secret, stable public URL, and provider credentials.
3. Prepare the database as described below.
4. Run `npm run dev`.

Email verification requires Resend and a verified EMAIL_FROM sender. Delivery failures are errors; OTPs are never logged as a substitute for delivery. Google login appears only when both Google credentials exist. Its redirect URL is `{BETTER_AUTH_URL}/api/auth/callback/google`.

Automatic capture uses Gemini when configured, then OpenRouter. Their quotas and charges are independent of ContextGraph. Failed processing retains queued notes and exposes retry in Settings. Reviewed structured/manual imports do not require a model call.

## Database setup and upgrade

Back up an existing database before upgrading. Do not apply the fresh-install auth snapshot over a populated database.

Fresh database:

1. Apply `supabase/2026-10-30-auth-schema.sql` (exact Better Auth 1.7.14 schema).
2. Apply `supabase/schema.sql` (application snapshot including recovery changes).
3. Apply `supabase/2026-10-30-oauth.sql` (idempotent OAuth tables/indexes and RLS backstops).

Existing database:

1. Set SUPABASE_DATABASE_URL and BETTER_AUTH_SECRET explicitly in your shell. The migration runner does not automatically load .env.local.
2. Run `npx tsx scripts/migrate-recovery.mts`. This is a dry run; review `.test-output/auth-upgrade.sql` and any unsafe-schema warnings.
3. After backup/review, run `npx tsx scripts/migrate-recovery.mts --apply`.

The runner uses the pinned provider's actual migration definitions, then applies the checked-in additive OAuth and application changes. Context, entries, identities, and API keys are preserved. RLS has no browser policies; the server database role must be permitted to access these tables. Keep the PostgreSQL connection secret server-side. No Supabase Auth/JWT bridge is introduced.

The upgrade also applies `2026-10-30-legacy-uniqueness.sql`: older live schemas can lack the scope/key-owner uniqueness present in fresh installs. Duplicate legacy rows cause this migration to fail for review; it never deletes or merges them automatically.

The old wizard finalization/parser endpoints return HTTP 410. `/onboarding` redirects to `/connect`; no reachable endpoint resets a user's graph during setup.

## Connecting clients

The canonical remote endpoint is `{BETTER_AUTH_URL}/api/mcp`. Set BETTER_AUTH_URL and NEXT_PUBLIC_APP_URL to the same stable deployment URL. Preview URLs are resolved consistently for issuer, resource metadata, and displayed instructions.

- Claude web: add a custom remote connector, choose OAuth, authorize ContextGraph, and enable it in the conversation.
- ChatGPT web: add/install a custom MCP plugin with OAuth and enable it in the conversation. Account/workspace permissions may restrict this feature.
- Existing terminal clients: send an API key in `x-api-key` or a Bearer header. Generate/replace the key in Settings; imports never rotate it.

Do not put API keys in query strings. That legacy authentication path was retired; migrate those clients to OAuth or header auth and replace previously exposed keys. A masked prefix cannot be copied as a working credential.

Official client setup instructions are linked in the app and were checked October 30, 2026. The local test suite verifies actual OAuth and MCP protocol exchanges using fixture clients, not the vendors' hosted chat UIs. Hosted Claude/ChatGPT compatibility must also be smoke-tested on the target account and a reachable HTTPS deployment before calling that deployment verified.

OAuth uses authorization code + PKCE, exact registered callbacks, resource/audience-bound tokens, read/write scopes, refresh, and revocation. Dynamic registration is enabled for external clients and binds registrations to the ContextGraph MCP resource. Read-only discovery metadata is public; tool execution never accepts browser cookies as MCP authorization. Client names are self-reported, not verified vendor identities.

## Tools and memory

- `contextgraph_setup(attempt_id)` returns reviewed-import instructions without receiving facts.
- `submit_context_import(attempt_id, notes)` receives a bounded draft only after the model has obtained permission; website review is the enforceable commit boundary.
- `get_context(scope?)` returns approved core context and active notes within one approximate token budget.
- `remember(text, kind?, scope?)` queues routine capture after setup; the user can pause it.
- `recall(query)` performs keyword search and returns note IDs.
- `resolve(entry_id)` removes an open problem from active context while retaining its history.
- `forget(entry_id)` deletes a note. The dashboard supports note and node deletion too.
- `list_nodes()` returns graph structure. Legacy `save_context` calls remain accepted but are not advertised.

Imports are atomic, reviewed, source-attributed, and deduplicated. Background processing uses leased work claims, idempotent writes, bounded retries, and an awaited Next.js after() promise. A daily cron is a safety net; no sub-daily Vercel Hobby schedule is required. Dashboard updates use authenticated refresh, not an anon-key realtime subscription blocked by RLS.

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm test` includes real PostgreSQL integration tests using a temporary embedded PostgreSQL cluster on an available loopback port. `npm run test:e2e` starts a separate temporary cluster on an available loopback port, a capture-only email/model fixture server on 3101, and Next.js on 3100. These fixtures override database/auth/provider configuration before importing the app; they never read production data or send real emails/model calls. They do not create a production auth bypass. Both clusters are disposable. Ports must be available. On Linux, run as a normal user rather than root.

For browser checks against an optimized build, run `npx tsx scripts/build-test.mts`, stop a development test server if one is using port 3100, set TEST_APP_MODE=production, then run `npm run test:e2e`. The fixture starts the optimized app from `.next-build`. The test build uses explicit isolated settings rather than .env.local credentials. Do not deploy that test-configured build.

Screenshots/logs/traces are written under `.test-output`, `test-results`, and `playwright-report` and are ignored by Git. CI runs lint, unit/database tests, a production build, and Chromium E2E tests. Browser scenarios cover manual setup and resume, actual signup/login forms, OAuth code/PKCE consent, refresh and revocation, draft review, cross-client recall, deletion, mobile layout, and access controls. External provider boundaries are local fixtures; actual Google OAuth and vendor chat UIs need separate account-authorized smoke tests.

## Release checklist

- Apply and verify the additive migrations against an isolated copy first.
- Configure stable auth/public URLs, secrets, verified email sender, Google callback if enabled, model credentials, and CRON_SECRET.
- Deploy to preview; verify a new account, reviewed import, and cross-client retrieval with the real Claude/ChatGPT accounts available to you.
- Check that pending/error states and revocation behave truthfully; only then promote production.
- Roll back application code to a compatible build if needed. Keep additive schema and newly saved user data; do not “roll back” by deleting imported memories.

## Scope and remaining product work

One personal graph per account. Account fields are read-only in this demo; account deletion and downloadable export are not implemented and are not presented as working controls. Semantic search, fuzzy superseding, teams, multiple graph workspaces, public sharing, directories, marketplace packaging, and digital twin remain deferred. See PRODUCT.md, ARCHITECTURE.md, DESIGN.md, and ROADMAP.md for their separate responsibilities.
