# ContextGraph — Product Roadmap

Version 1.0 | Written 2026-09-12

This is the **forward plan**: what we build next, in what order, and why. It is not the current-state reference (see [ARCHITECTURE.md](ARCHITECTURE.md)), not the product scope (see [PRODUCT.md](PRODUCT.md)), and not the visual spec (see [DESIGN.md](DESIGN.md)).

**Active planning update — 2026-10-29:** see [Demo recovery implementation plan](#demo-recovery-implementation-plan--2026-10-29) below. This is a proposed implementation plan, not a shipped feature. It corrects the earlier P1 completion claim and brings the minimum MCP OAuth work forward from P5 to support the requested ChatGPT/Claude journey. Historical phases below remain as the record of the earlier plan.

When a phase ships, mark it done here **and** append the architectural decisions to ARCHITECTURE.md's log. Don't delete completed phases — the order we did things in is part of the record.

---

## The one sentence

> **Other memory tools remember your past. ContextGraph carries your present.**

Existing tools (Mem0, ChatGPT memory) store slow facts about who you are — "user is a developer, likes Python." Useful, but losing them costs you little.

ContextGraph stores **what you are working on right now** — the decision you just made, the constraint you just hit, the bug you are still stuck on. Losing *that* is what actually hurts, because it means re-explaining forty minutes of work every time you switch tools.

### The moment we are building for

A person is working with Claude. They need an image. Claude can't make images. They open ChatGPT and say "make the image for what we were just doing" — and it already knows.

That is the product. Every decision below should be judged against whether it makes that moment happen more reliably.

### What we are not building

**Not a browser extension.** The drag-a-capsule extension already exists, and extensions only work on chat websites in Chrome. They cannot reach Claude Code, Cursor, or any terminal agent. That is exactly where our users are and exactly where MCP reaches. One channel: MCP.

---

## Priority order at a glance

| Phase | What | Why this order | Gate |
|---|---|---|---|
| **P0** | Security fixes | A data leak ends the project. Nothing ships before this. | Blocks everything |
| **P1** | Automatic capture | The core product change. Removes "type /save". | Blocks P4 |
| **P2** | Memory quality | Auto-capture without this = noise in one month. | Blocks P3 |
| **P3** | Recall across tools | First feature useful on day one, before any handoff happens. | — |
| **P4** | Free distribution | Get real users. Needs P1+P2 or we ship the laggy version. | Needs basic privacy policy |
| **P5** | OAuth | Kills key-pasting setup. Required for directory listings. | Blocks P6 |
| **P6** | Trust, legal, directories | Needed before non-developers use this. | — |
| **P7** | Digital twin | Bonus. Pure upside, zero dependency. | — |

---

# P0 — Security (blocking)

Not optional and not deferrable. Everything below assumes P0 is done.

### P0.1 — Verify and fix RLS *(critical)*

The `NEXT_PUBLIC_SUPABASE_ANON_KEY` ships in the browser bundle and is public by design. `supabase/schema.sql` says no RLS policies exist. If RLS is genuinely off in the live project, **every user's context may be readable by anyone holding that public key.**

Test first:

```bash
curl -s "https://YOUR_PROJECT.supabase.co/rest/v1/context_nodes?select=user_id,scope,content&limit=5" -H "apikey: YOUR_ANON_KEY"
```

If rows come back, fix immediately:

- Enable RLS on `context_nodes`, `context_entries`, `context_edges`, `api_keys`.
- Add **no** policies. The service-role key bypasses RLS, so every server route keeps working unchanged.
- This breaks the browser realtime subscription in `GraphProvider.tsx` (anon key will receive nothing). Replace with polling or a server-pushed refresh. Don't reach for a Supabase JWT bridge — it re-introduces the second auth system we deliberately avoided (ARCHITECTURE.md log, 2026-05-08).
- Write the change as a new dated `.sql` file and log it in ARCHITECTURE.md.

### P0.2 — Rate limiting

The `rate_limits` table exists and nothing reads it. Every `save` call runs an LLM judge, so one leaked key is an unbounded bill. Count requests per key per hour-window **before** the model call.

### P0.3 — API keys in query strings

`extractApiKey` accepts `?key=`. Those land in server logs, browser history, and `Referer` headers. We can't drop it while web clients need it, so: scrub the parameter from all logging, and rotate any key that has been passed this way. P5 (OAuth) retires this properly.

### P0.4 — Secret scrubbing on write *(also a P6 trust feature)*

Once capture is automatic, people will paste API keys and passwords into chats and we will store them forever. Strip anything matching common secret patterns (`sk-`, `ghp_`, `AKIA`, long base64 blobs, `password:`) before writing. Cheap regex, prevents the worst possible headline.

### P0.5 — Prompt-injection guard on writes

`save_context` currently prepends model output straight into node `content` (`app/api/mcp/route.ts:268`). Once the agent is auto-summarizing web pages and files it read, a hostile page can write instructions into permanent memory that replay into every future session.

- Cap `content_addition` length.
- Auto-writes go to `context_entries` (append-only, reviewable), never mutate `content` directly.
- Only a human action in the dashboard promotes an entry into `content`.

---

# P1 — Automatic capture ✅ done 2026-09-12

**Goal:** the user never types "save my context" again.

Shipped: `instructions` on `initialize`, imperative tool descriptions, protocol text (with bootstrap detection) in `get_context`'s reply, the `remember`/`recall`/`resolve`/`forget` tools alongside `get_context`/`list_nodes`, the two-stage save (`staged_context_entries` + `lib/process-staged.ts` batched judge), per-tool-call logging for future measurement, `kind` on entries, and killing the forced onboarding wizard (`onboarding_done` now means "connected a tool," set on first MCP `initialize`). See ARCHITECTURE.md log, 2026-09-12, for the full breakdown and what was deliberately deferred to P2/P3.

**Corrected 2026-09-13:** the batched judge was originally triggered by a Vercel cron every 5 minutes — that failed to deploy on the Vercel Hobby plan (which only allows daily cron schedules). Fixed by triggering the drain via Next.js `after()` from real `get_context`/`remember` traffic instead of a clock, with the cron demoted to a once/day safety net. See ARCHITECTURE.md §6 and log, 2026-09-13. Worth remembering for any future phase that assumes frequent background jobs: check the target Vercel plan's cron limits before designing around cron frequency.

An MCP server cannot push. It only answers when asked. So we can't force a save — we make the model *want* to save, through three slots that all reach the model's context.

### P1.1 — Slot 1: `instructions` on `initialize`

`app/api/mcp/route.ts:77` returns `protocolVersion`, `capabilities`, `serverInfo` — and nothing else. The MCP spec has an optional `instructions` field that clients feed into the system prompt. Add it.

Support varies by client (Claude Code uses it; not everyone does), which is why slots 2 and 3 exist.

### P1.2 — Slot 2: imperative tool descriptions *(most reliable)*

Tool descriptions are **guaranteed** to reach the model — it cannot call a tool without seeing the description. Better, it reads them at the exact moment it decides "should I call this?"

Rewrite from passive to imperative. Today: *"Evaluate a session summary and save it."* Should be: *"Call this the moment the user states a decision, preference, constraint, or gets stuck."*

Keep them short. Descriptions cost tokens on every single request — a long protocol makes users' sessions expensive and gets skimmed anyway.

### P1.3 — Slot 3: protocol text in the `get_context` reply

`get_context` runs at session start, so its return text is a reliable place to restate the rules. This catches clients that ignore slot 1. It can get compacted away in very long sessions, so it's the backup, not the primary.

### P1.4 — The save rule: over-call, filter server-side

**The model does not decide what is worth saving. We do.**

A rule like *"call this when the information is important"* asks the model for a judgment call, and judgment is exactly where models are inconsistent across clients. A mechanical rule gets followed far more reliably. So the instruction becomes coarse and binary:

> Call `remember` after any exchange where something was decided, chosen, concluded, or failed. **When in doubt, call it.** The server decides what to keep.

That last line is load-bearing: it tells the model that over-calling is free and correct, which is what gets us near-mechanical behavior without literally firing on every "ok thanks."

Moving the decision server-side also means we can improve the filter any time without touching a single user's setup.

#### Two-stage, or it wrecks the product

Do **not** run the LLM judge inside the tool call. Three reasons it fails:

1. **Lag** — the AI waits for our tool before it can reply. An LLM judge in that path adds seconds to *every single response*. That is the "it feels laggy" complaint that started this whole plan.
2. **Cost** — a 50-message session = 50 judge calls. Bill scales with every message of every user. Wrong shape for a free product.
3. **Noise** — visible tool call after every message looks broken.

Split it:

| Stage | What | Budget |
|---|---|---|
| **1. Tool call** | Accept text. Cheap checks only — too short, exact-duplicate hash against recent, obvious junk. Write to staging table. Return. | ~50ms, no LLM |
| **2. Background judge** | Batch job over the staging table. **20 items in one prompt**, not 20 prompts. Applies the keep/drop rule, assigns `kind`, merges duplicates. | Off the critical path, ~10–20x cheaper |

The keep/drop rule the judge applies:

> **Keep it if the user would be annoyed to have to explain it again.**

| Keep | Drop |
|---|---|
| A decision — "we're using email OTP, not passwords" | One-off bug fixes |
| A preference — "always dark mode, no rounded buttons" | Factual questions |
| A constraint — "free tier only, no paid APIs" | Rewrites, formatting, translation |
| **Something still broken after real effort** | Anything they'd never ask about again |
| A change of direction — "dropped the extension idea" | Small edits |

**Knock-on effect:** aggressive saving makes P2.3 (dedupe and supersede) **required, not optional**. Save the same fact ten times and the context is unusable within days.

#### The 100% path for Claude Code

The P4.2 plugin can register a `Stop` hook — code that runs when the AI finishes a turn. It doesn't ask the model for anything, it just fires. 100% reliability, no instructions involved.

Not possible in ChatGPT web, but it means Claude Code users — our main audience today — get a perfect experience while everyone else gets the 80–90% instruction-driven version.

### P1.5 — Redesign the tools

The current three tools were built around a session that **ended well** — `save_context` requires `goal` and `achieved`. But people switch AI tools precisely when they are **stuck**. We are throwing away the most valuable case.

Target set (keep it to ~6 — every tool costs tokens on every request):

| Tool | Purpose | Change |
|---|---|---|
| `get_context(scope?)` | Read context at session start | `scope` becomes optional; sensible default |
| `remember(text, kind, scope?)` | **New.** One-line save, mid-conversation | The fix for "manual effort" |
| `recall(query)` | **New.** Natural-language search | Powers P3 |
| `resolve(id)` | **New.** Mark an open problem solved | Keeps live context clean |
| `forget(id)` | **New.** User-initiated delete | Required for P6 |
| `list_nodes()` | Graph structure | Keep as-is |

`save_context` is demoted — keep it working for existing users, stop advertising it as the main path.

### P1.6 — Kill the onboarding wizard (cold start)

The current wizard (`/api/onboarding/finalize`) asks for name, role, location, skills, stack, projects, goals, working style, agency name — and `proxy.ts:45` **forces** the user through it before they can reach the dashboard or connect page.

That was correct for the old product: if saving required typing "save my context," the graph would stay empty forever, so we front-loaded a form to guarantee something was there. **Auto-capture removes that reason.** What's left is a wall of work in front of the payoff — the exact thing that kills adoption.

New flow: **sign up → connect a tool → start working.** `onboarding_done` changes meaning from "filled the form" to "connected at least one tool" (set it on first successful MCP call). Update `proxy.ts` accordingly.

But an empty graph is also unacceptable — `get_context` returning "No context found" on the first session reads as broken.

#### The trigger: one explicit command

After connecting, the user types **`initialize contextgraph`** once. That's it, ever.

Deliberately *not* "the model notices the graph is empty and offers an import" — that's a judgment call, which is the unreliability we're trying to escape. An explicit command is deterministic. And one command during setup, when the user already expects to do something, is acceptable friction in a way that a nine-field form is not.

- Connect page shows the command as a **copy button**, not text to memorize.
- The P4.2 Claude Code plugin ships it as a real slash command (`/contextgraph-init`) — no typo risk, appears in the menu.

#### What the command does — three zero-effort fills

**1. Ask the AI what it already knows.** ChatGPT and Claude have been accumulating memory about this person for months, and it's sitting in the session we just connected to. The command tells the model to state what it already knows and save it. Months of context in thirty seconds, user types one word. *This replaces the import screen entirely.*

**2. Read the repo.** For Claude Code and Cursor, the project **is** the context — `CLAUDE.md`, `package.json`, `README`, git remote and user. The agent can already read files. First connect inside a repo learns the stack, project name, and conventions with nothing typed. Strong developer pitch: *connect it in your repo and it already knows your project.*

**3. Bootstrap mode.** While the graph is small, the background judge (P1.4) keeps more than it normally would. Fills in one conversation instead of ten, then tightens to the normal bar. A threshold on the server, not instruction text.

Cautions:

- **Show what was imported.** ChatGPT's memory carries stale and wrong facts, and this is model-generated text heading into permanent storage — same risk as P0.5. A "here's what I brought over, remove anything wrong" screen fixes both the accuracy problem and the creepiness, and builds trust instead of spending it.
- **Keep `parse-memory` as an optional shortcut** on the dashboard for people who want to paste a memory dump. Just not in the required path.

This changes the onboarding data shape that AGENTS.md lists as locked, and changes what `onboarding_done` means — log both in ARCHITECTURE.md when it lands.

### P1.7 — Measure it

Ship a counter: save-worthy moments vs actual calls, broken down by client. The 80–90% figure is a guess until we have this. Without measurement we can't tell whether prompt changes help or hurt.

---

# P2 — Memory quality

Auto-capture creates a new problem: fifty entries a day, duplicates, and contradictions. Without this phase, memory becomes noise within a month and `assembleContext`'s 4000-token budget starts truncating the good stuff.

This layer is the actual defensible part of the product. Anyone can build a notes table behind an API key. Almost nobody gets **forgetting** right.

### P2.1 — `kind` on entries

`decision` | `preference` | `constraint` | `open_problem` | `resolved`

`open_problem` is the important one. When someone lands in ChatGPT and says "continue," the first thing they should see is *what is broken and what has already been tried*. That is the handoff. It costs one database column.

### P2.2 — `source` tracking

MCP clients send `clientInfo.name` during `initialize` — "claude-code", "ChatGPT", "cursor". Tag every entry with where it came from. No user effort, and it powers P3's "I don't remember which tool I was using."

Implementation note: our endpoint is stateless (each POST is independent), so `clientInfo` at initialize needs to be stored against the API key, with `User-Agent` as the fallback for calls that arrive without it.

### P2.3 — Dedupe and supersede

- On write, compare against recent entries. Near-duplicate → merge instead of appending.
- Contradiction ("using Postgres" → "moved to Mongo") → mark the old one superseded, don't delete it.
- `resolve` moves an `open_problem` to `resolved` — out of live context, still in history.

### P2.4 — Fix the hierarchy drift

`parent_scope` and `context_edges` are two representations of the same thing and can silently diverge (ARCHITECTURE.md §8). Auto-capture will write far more often and make this worse. Pick one as the source of truth before the volume increases.

---

# P3 — Recall across tools

**The pitch:** every conversation you've had, across ChatGPT and Claude and Gemini and Cursor, searchable in one box.

This matters more than it looks, for one reason: **it is useful on day one, before the user has ever switched tools.** Handoff only pays off the second time. Search pays off immediately. That is what gets people past the first week.

### P3.1 — Semantic search

Embed entries on write. Natural-language query, not keyword matching — "that auth thing I was stuck on last week" should work.

### P3.2 — Filter by source and time

Straight out of P2.2. "Show me what I did in Claude Code last Tuesday."

### P3.3 — Dashboard search page

One box, results grouped by project and tool. This becomes the main dashboard screen.

> **Demote the 3D graph.** It is beautiful and it is not why anyone will use this. Keep it as a "look inside" view, not the front door. No further investment right now.

---

# P4 — Free distribution

Get real users. Everything before this was building; this is shipping.

### P4.1 — MCP Registry

The open community registry. Free, self-serve, no approval gate. An afternoon of work. Not a big traffic source on its own, but other directories pull from it.

### P4.2 — Claude Code plugin + marketplace *(best-value item in this phase)*

A marketplace is just a public Git repo with a `.claude-plugin/marketplace.json`. Free, self-serve, no review, no waiting. The plugin bundles the MCP server connection **and** our instructions together, so the user gets both from one install command.

Our users today are developers. This is exactly where they are.

### P4.3 — Gate: minimal privacy policy

Real users storing real data means we need a privacy page live before this goes public. Full version is P6; a short honest one is enough to unblock here.

---

# P5 — OAuth

**This is the phase that turns a side project into something a normal person can install.**

Today's setup is: create account → generate key → find a config file → paste JSON. That is a developer's setup, and a normal person will never finish it. This is the honest answer to "why would anyone go through all this?"

Target: **install → click Connect → sign in with Google → working.** No config file, no key ever shown.

- Implement OAuth 2.0 on the MCP endpoint, including dynamic client registration.
- Keep the API-key path for terminal tools (Claude Code, Cursor) — it's genuinely better there.
- Retires P0.3's query-string problem for good.
- Both Claude's and OpenAI's connector directories expect OAuth, so this is the prerequisite for P6.

Biggest single piece of engineering in the plan. Budget for it accordingly.

---

# P6 — Trust, legal, directories

### P6.1 — Security posture (the honest version)

**We cannot offer end-to-end encryption, and we must not claim to.** The entire purpose of this product is to hand context to an AI. The server has to read the text to run the judge, build search, and return it to Claude. If the server can't read it, the product doesn't work. Claiming E2E while doing that is a lie someone will eventually catch.

What we do instead, and can defend honestly:

| Measure | Status |
|---|---|
| Encryption at rest (Supabase disk-level) | Already on |
| Secret scrubbing on write | P0.4 |
| Access log — every read/write, with source and time | Build here; also powers rate limiting and usage stats |
| Never train on user data | Policy commitment |
| Real deletion — one click, actually gone, cascades | Build here |
| Data export — user takes their graph and leaves | Build here |
| Minimize what we store | Ongoing; P2.3 helps |

Application-level column encryption is worth discussing but is close to theatre on its own: the server needs the plaintext anyway, so it mostly protects against a stolen database dump and not against a compromised server. Decide deliberately, and log the reasoning either way.

### P6.2 — Privacy policy and terms

Say plainly: what we store, who can read it (including that content is sent to OpenRouter/Gemini for judging — this is a **subprocessor disclosure** and must be named), how long we keep it, how to delete it.

### P6.3 — Account deletion

Currently a dead button with no route behind it (ARCHITECTURE.md §8). Must work before we take non-developer users.

### P6.4 — Directory submissions

Claude's Connectors directory and ChatGPT's app directory. Both are curated with a review process, neither charges a listing fee, both expect OAuth (hence P5 first).

> Verify current submission requirements directly on Anthropic's and OpenAI's developer docs before building to them. Both programs have been changing fast and these requirements go stale quickly.

---

# P7 — Digital twin *(bonus)*

Honest assessment: weak as a reason to install, good as a reason to share. Nobody adopts a tool to get a personality profile. But it's cheap on top of data we already have, and it makes screenshots.

Keep it narrow and useful rather than novelty:

- **Profile card** — how you work, what you decide fast vs slow, your stack. Shareable.
- **"Draft as me"** — a tool that returns your voice and preferences so any AI writes the way you would.
- **Agent briefing** — one paste-able block that brings a brand new agent up to speed on you.

Zero dependency on anything above. Build it when you want a fun week.

---

## Open questions

- Free vs paid split. Personal free / team paid is the obvious shape (the `agency` scope already exists in `assembleContext`), but shared team context needs a real permission model that doesn't exist yet.
- How long to keep `resolved` and superseded entries before archiving.
- Whether the dashboard shows raw entries or only AI-summarized state.

## Ground rules

1. **Nothing ships before P0.** A leak ends the project regardless of how good the rest is.
2. **Every phase gets an ARCHITECTURE.md log entry** when it lands.
3. **Measure before tuning.** P1.7 exists so we argue from numbers, not vibes.
4. **Judge every feature against the moment.** If it doesn't make the Claude-to-ChatGPT handoff more reliable, or get someone to install, it waits.

---

# Demo recovery implementation plan — 2026-10-29

Status: **deployed; hosted vendor-account verification pending** (2026-10-30). The approved recovery scope is deployed at https://context-graph-amber.vercel.app. See the implementation and release records below for evidence and remaining account-specific checks.

## 1. Outcome and product decisions

A new or empty account must land in a useful guided setup flow, never an empty graph. Primary path:

**Sign in → choose Claude or ChatGPT → connect → prepare and approve facts in the client → receive and review notes → save → open the dashboard.**

Returning users with usable context go directly to the dashboard. Users who stop partway resume their saved setup step. They do not repeat OAuth or lose an import by refreshing.

The app does not fetch native ChatGPT/Claude memory directly. An MCP connection lets the AI call our tools. The AI can propose facts actually available to its conversation, and the user can explicitly supply an export when needed. We cannot guarantee access to all stored memories or past chats. A ContextGraph website button cannot instruct an idle external chat to run a tool; its honest action is to show/copy the setup prompt and open the client.

Use a portable natural-language prompt named **Set up ContextGraph**. Do not advertise `/setup contextgraph` as a registered slash command in ChatGPT or Claude web. Client-specific slash commands are future packaging work.

Retain a secondary **Create context graph** path: one short context editor, not the old identity/stack/projects/goals wizard. Pasting an export is a secondary import fallback with review. Neither path generates invented sample memories. One nonempty user-approved note is enough to create useful context; no arbitrary minimum note count.

Only one personal graph per account in this iteration. “Create context graph” initializes an empty account; it does not create multiple graph workspaces or replace an existing graph.

## 2. Verified integration boundaries

Checked against official documentation on 2026-10-29:

- [OpenAI custom MCP setup](https://developers.openai.com/api/docs/guides/custom-mcp-server): ChatGPT supports remote MCP tools, with access dependent on account/workspace permissions. Current instructions describe installing a custom plugin and enabling it in a conversation. Keep our steps dated and link the source; do not claim every account can add one.
- [OpenAI authentication](https://developers.openai.com/plugins/build/auth): authenticated private-data integrations use OAuth. Custom API-key headers are not supported by ChatGPT. Therefore do not ship the old query-key snippet as the primary ChatGPT solution. Implement authorization-code OAuth with PKCE, resource discovery, scopes, token validation, refresh/revocation, and a supported client registration/discovery path.
- [Claude remote connectors](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp): use remote connector setup, account-appropriate steps, and explicit conversation enablement. Remote connections originate from Claude infrastructure and need a reachable endpoint. Do not describe local JSON config as the Claude web setup.
- [Claude memory transfer](https://support.claude.com/en/articles/12123587-import-and-export-your-memory-from-claude): user-directed memory export is available as an explicit operation. This supports a paste/export fallback; it is not evidence of a public API we can call to extract memory.
- [Better Auth MCP](https://better-auth.com/docs/plugins/mcp) and [OAuth provider](https://better-auth.com/docs/plugins/oauth-provider): prefer the maintained provider integration over custom authorization/token cryptography. Current docs and installed versions must be matched before installation; do not copy a newer protocol-only example that excludes our target clients.

The earlier decision to leave all OAuth in P5 is superseded for this recovery plan. Minimal OAuth is a demo dependency for ChatGPT, not optional polish. Public directory submission, discovery marketing, and universal-client claims remain deferred.

## 3. Screen flow and interaction contract

### Entry and routing

- Email signup, verification, Google signup, ordinary login, and already-authenticated visits to auth pages resolve through one server-owned destination helper.
- Preserve and validate OAuth continuation parameters; an authorization callback must resume consent rather than being redirected into an onboarding loop.
- `/connect` becomes the canonical setup route. `/onboarding` becomes a safe compatibility redirect to it, preserving supported import intent.
- `/dashboard` performs a server-side session/readiness check before rendering its graph or mounting its data provider. A cold account redirects to setup with no empty-dashboard flash.
- Keep `proxy.ts` as Next.js 16 proxy. Add page/layout guards as appropriate; do not rename it to middleware.
- Existing populated accounts remain accessible. An expired connector grant must not lock a user out of their already stored context.

### Step A — Choose your AI

Show Claude and ChatGPT as the primary options. Explain: “Connect an AI, then choose what it shares with your ContextGraph.” Show compact compatibility guidance and links to the dated official setup instructions.

Secondary actions: **Create context graph** and **Paste a memory export**. Other clients are an advanced section only when their instructions have actually been tested; hide unsupported claims.

### Step B — Connect

Show only the selected client's steps, server URL, OAuth instructions, and an action to open that client. Copy controls have explicit success/failure feedback. Keep setup state when the user switches tabs or returns later.

Track separate milestones: grant authorized, authenticated MCP request received, and import received. “Connected” requires observed authenticated client traffic; a website preview request or completed OAuth redirect alone is insufficient. Initialization metadata is helpful but not trusted proof of vendor identity. Associate events with the connection/grant, not one shared `last_client_name` value.

Display **Waiting for Claude/ChatGPT to connect** until an appropriate request arrives. Include troubleshooting and a retry action. A manual “I've done this” click can move instructional focus, but cannot mark a connection verified.

### Step C — Prepare an import in the client

The primary website action is **Copy setup prompt**, followed by **Open Claude/ChatGPT**. Button copy must not imply a background pull of native memory.

Prompt requirements:

1. Use the connected ContextGraph tool's setup instructions and bind to the current import attempt.
2. Propose concise facts from information actually available: identity, preferences, stack, active projects, decisions, constraints, and open problems.
3. Do not invent missing facts or claim complete access to native memory. Do not include credentials, entire chat transcripts, or unrelated sensitive details.
4. Display the exact proposed notes to the user in the conversation, allow corrections, and ask permission to send them to ContextGraph.
5. Before approval, make only the read-only setup/status call. Do not call `remember` to bypass import review.
6. After approval, submit the exact approved facts using a dedicated import tool; report the returned receipt and next step. If the user declines, send no note content.
7. If no useful information is available, say so and offer a short user-provided context or export. Do not send a fictional profile.

The server cannot independently prove a human said “yes” in an external conversation. A model-supplied `approved: true` is not authoritative consent. The website's final review/commit is the enforced boundary for adding durable graph notes. Chat approval protects the proposed transfer; website review protects what becomes the active graph.

### Step D — Receive, process, review

The website displays server-reported states: waiting for submission, received, processing, ready for review, retryable failure, canceled, and saved. Show counts and timestamps where real; no fake percentages or optimistic “import complete.”

Present proposed notes with source and suggested project/category. Users can edit, deselect, or remove a note and see duplicates/skipped items. Disclose that processing uses configured AI providers. Source means reported submitting client/connection, not guaranteed historical authorship of a fact.

Primary action: **Save N notes & open dashboard**. Success is shown only after a committed write. Repeated clicks are idempotent. Failure preserves the draft and allows retry. Review is compact and inline; avoid a sequence of modal confirmations.

If zero notes remain, do not open an empty graph. Offer **Try import again**, **Choose another AI**, or **Create context graph**.

### Step E — Ready dashboard

Show actual saved notes and graph structure. Include **Connect another AI**, **Import more**, **Add context**, and visible processing/connection status where useful. A second import merges with existing data and never rotates an API key or deletes existing nodes.

The explicit manual path can make an account ready after saving useful context even without a connector. Its UI must show that connection is still pending. If the user later deletes the last meaningful context, show the recovery/setup surface rather than a blank canvas.

## 4. Readiness and migration model

Do not reuse `user.onboarding_done` as the sole decision. It currently mixes wizard completion and handshake completion, and may be stale in cached sessions.

Define typed `SetupStatus` and `SetupStep` derived server-side from persistent facts:

| Situation | Surface |
|---|---|
| No approved context; no attempt | Choose AI / create context |
| No approved context; connection being configured | Connection steps |
| Connection observed; no submission | Setup prompt and waiting state |
| Import received or processing | Processing with recovery controls |
| Reviewable import | Notes review |
| Meaningful approved context exists | Dashboard |
| Failed/canceled import and no approved context | Recover at the relevant setup step |

An empty `me` placeholder does not count as readiness. An import receipt alone does not count. Legacy node content or existing permanent entries do count, so existing users are not forced to import again. Keep the old boolean temporarily for compatibility and remove routing dependence on it. Record this reversal in the Architecture Log when implemented.

OAuth authorization and database session identity remain Better Auth-owned. Query current setup data through typed `lib/db.ts` helpers rather than relying on the five-minute session cookie cache.

## 5. Data and API contracts

Add dated, checked-in SQL migrations plus an updated schema snapshot and strict types. Final column names may follow the provider's versioned schema; the following responsibilities are fixed:

- **Client connections:** user, OAuth grant/client or legacy credential reference, user-selected provider label, reported MCP client metadata, first/last authenticated activity, revocation state. Support distinct Claude and ChatGPT connections without one overwriting the other.
- **Import runs:** user, connection, status, attempt identifier, input digest, timestamps, bounded error code/message, lease/retry metadata, completion receipt, accepted/skipped counts, and optional expiry. Raw imports/drafts remain separate from active graph content and are removed after cancellation/expiry/retention limits.
- **Import items:** run, stable item ID, proposed text/kind/scope, review state, duplicate match, and committed entry reference. Enforce ownership through the parent run as well as explicit user filtering.
- **Permanent entries:** preserve `source_connection_id`, import/run reference where applicable, kind, timestamps, and stable dedupe/idempotency identity. Retain the submitting source after the staging queue drains.
- **Staging:** explicit pending/processing/retry state, claim/lease fields, attempts, bounded failure details, and stable source/idempotency identity. No silent “processed” deletion when target creation or persistence failed.
- **OAuth provider tables:** use the maintained provider's migration definitions, reviewed and checked in. Do not guess its table shape or run an unrecorded production migration.

Candidate web contracts:

- `GET /api/setup/status`: current derived step, observed connections, current import summary, available actions; no secrets or raw imports.
- `POST /api/imports`: create a pending import attempt for a selected connection or paste fallback.
- `GET /api/imports/:id`: user-owned progress and reviewable draft items.
- `PATCH /api/imports/:id/items`: validate and store review edits/selections.
- `POST /api/imports/:id/commit`: atomically save the selected revision with an idempotency key, return receipt and readiness.
- `POST /api/imports/:id/retry` and `/cancel`: bounded retry/cancel for owned runs; cannot cancel a committed import into an implicit deletion.
- `POST /api/setup/manual`: validate and save a minimal user-written context, returning the same readiness contract.
- Connection listing/revocation can use `/api/connections` and `/api/connections/:id`; revocation does not delete stored memories.

All web writes require Better Auth session authorization and origin/CSRF protections. All queries and transactional app operations go through typed server helpers in `lib/db.ts`.

Dedicated MCP setup tools:

- `contextgraph_setup` with no note content: return the bounded setup instructions and current import-attempt information for the authenticated user/connection. No native memory access occurs here.
- `submit_context_import`: accept a validated, size-bounded array of user-approved proposed notes, an attempt reference, and an idempotency identity; create a reviewable draft and return a receipt. This does not commit to the graph or mark setup ready.
- Preserve existing `get_context`, `remember`, `recall`, `resolve`, `forget`, and `list_nodes`; retain the legacy `save_context` handler for compatibility.

Import status/IDs are owner-checked and scoped to the authenticated connection. Do not put API keys or reusable credentials in the setup prompt. Never trust a supplied user ID, source label, or consent boolean as authorization.

## 6. OAuth and MCP compatibility work

Do this early: the user journey cannot be declared complete if ChatGPT cannot authenticate.

1. Reproduce the lockfile installation. Documentation says Better Auth 1.6, while the checked-in lockfile and local install currently resolve 1.7.4. Verify the actual auth schema and migration requirements before changing versions.
2. Select and pin a stable maintained Better Auth OAuth/MCP provider and official MCP transport SDK combination compatible with both target clients. Prove discovery, consent, callback, and authenticated tool calls before broad UI work. Do not introduce a second identity service or hand-roll token crypto.
3. Publish correct issuer/resource metadata and unauthorized challenges, implement tested client discovery/registration, permission-scoped authorization, token refresh and revocation. Validate resource/audience, expiry, issuer, and scopes on every protected tool call.
4. Make user identity resolution explicit for either OAuth tokens or existing API keys. Invalid OAuth tokens must not fall back to cookies; keep MCP independent of web sessions.
5. Support existing API-key clients through headers. Do not rotate keys during import. Remove query-key examples from primary onboarding; if legacy query authentication is retained temporarily, redact every accepted alias and publish a migration path.
6. Replace hardcoded protocol negotiation/hand-rolled transport behavior where needed with the tested SDK. Correct tool schemas/annotations, notification responses, CORS/exposed headers, and reconnect handling. Expose no private data through public discovery or tool listing.
7. Keep capability/source labels honest. Any per-client verification marker is an observed integration event, not proof that all future requests come from the named vendor.

Exit gate: both clients can authenticate to an isolated demo endpoint, discover tools, make an authenticated setup call, and revoke access. If account permissions or a provider incompatibility prevent this, record the exact limitation and do not call that client supported or silently ship a key-query workaround.

## 7. Memory correctness and processing reliability

- Create/reuse a root node idempotently in the transaction that commits useful entries. No placeholder-only graph unlock, no discarded accepted note because a root is missing.
- Commit import items, nodes, derived edges, and completion receipt atomically. Roll back incomplete work on failure. Preserve all prior context and keys.
- Do not compress approved import facts into the current fixed 25-word summary if it changes meaning. Preserve reviewed text within documented input limits; reject oversized inputs clearly rather than silently truncating essential facts.
- Add exact normalized dedupe plus idempotency for resubmission/concurrent requests. Repeated imports of the same item must not append duplicates. Flag possible contradictions for review; automatic fuzzy merging and a complete superseding engine remain deferred.
- Persist source metadata into permanent entries. A shared API key's `last_client_name` is not an adequate multi-client attribution model.
- Make `get_context` assemble approved node content plus appropriate active entries. Include scoped ancestors, recent decisions/constraints/preferences, and open problems; omit resolved/superseded items from active context while retaining history. Enforce one overall budget with deterministic priorities.
- Make `resolve` and `forget` visibly affect subsequent context reads and dashboard results. Show reliable entry IDs in recall/detail results.
- Use `parent_scope` as the hierarchy source of truth for this release and maintain edges as a derived representation. Backfill/check existing drift and apply parent/scope/descendant changes through one atomic helper. Validate cycles, ownership, missing parents, and scope collisions. Keep graph rendering compatible with existing edge direction.
- Separate import review from routine auto-capture. Initial setup is explicit and reviewed. After setup, make automatic capture behavior visible with an enable/pause control; no hidden bootstrap import triggered by an empty `get_context`.
- Claim queued work atomically with expiring leases; mark success only after persistence. Make partial completion and retries idempotent, preserve failed work, and bound attempts with a user-visible recovery state.
- Return/await the drain Promise from Next.js `after()` rather than detaching work inside a void callback. Use bounded batches/timeouts and the daily safety-net cron; do not rely on sub-daily Hobby cron.
- Treat LLM output as untrusted structured input. Validate JSON shape, item IDs/counts, kinds, text sizes, and allowed target scopes. Preserve original approved input when summarization fails and provide an explicit retry/manual-review path; never replace a parse failure with a successful empty import.
- Scrub secrets before AI processing and persistence, keep imported text out of instruction slots, and avoid logging note contents, credentials, or tokens. No automatic mutation of core content from a model's suggestion.

## 8. Dashboard UX and performance

Use the existing DESIGN.md tokens and component vocabulary. The user is a developer switching between browser tabs to configure a tool; the screen should make the next action obvious and preserve progress on return. One dominant action per step, readable instructions, no decorative tour required to proceed.

- Put setup outside `DashboardShell` and `GraphProvider`; do not load Three.js/WebGL, graph data, or realtime subscriptions before readiness.
- Use a compact progress indicator with real milestones. Keep the selected client and successful earlier steps visible. Show source-specific “waiting” states without an indefinite blocking spinner.
- Use authenticated setup polling only while waiting/processing: begin around 2 seconds, back off toward 10 seconds, pause in hidden tabs, refetch on focus, cancel obsolete requests, and stop when done. Include an explicit refresh action.
- Replace browser-anon private-data subscriptions with authenticated server refresh for graph and entry changes. Refresh after local writes, on focus, and on bounded intervals where needed. Keep existing data visible during background refresh; distinguish load errors from an empty graph.
- Lazy-load the graph after readiness and provide a usable notes/list view if WebGL is unavailable or slow. Do not redesign the whole dashboard into the future search product in this iteration.
- Preserve existing node CRUD, context preview, theme behavior, and responsive navigation. Add import/source and processing status where actionable.
- Keyboard navigation, visible focus, 44px hit areas, screen-reader status announcements, reduced motion, and light/dark contrast are acceptance requirements. Follow the 4px spacing grid; add tokens rather than inline color values.
- No artificial processing delays, forced intro animation, surprise redirects during review, or claims of instantaneous background memory sync.
- Measure setup transfer size and graph-load separation, request counts, layout shifts, and route/interaction timings. Target LCP <= 2.5s, CLS <= 0.1, and INP <= 200ms where a representative environment can measure them; record lab results and limitations rather than inventing field metrics. External OAuth/AI latency must have visible feedback and bounded recovery, not be hidden inside a performance claim.

## 9. Remove misleading and dead behavior

- Retire the long wizard and its destructive finalize implementation from the normal flow. Preserve useful memory-import UI/parsing only behind the safe new import contracts. Legacy endpoints must either delegate safely or return a clear retired response; no reachable destructive backdoor.
- Replace fake connection testing with real integration status and clearly labeled endpoint diagnostics.
- Remove stale `/save`-required copy, invented client setup instructions, masked-key copy actions, claims of guaranteed automatic memory extraction, and fake import success.
- Remove or disable account-edit/delete controls that are not implemented. Do not show a successful save toast for a no-op. Full account-management work remains separately scoped; disconnect and note deletion needed by this release must work.
- Ensure production verification email failures are reported correctly and never fall back to logging OTPs as a pretend success. Validate required environment configuration; document Resend sender setup, Google callbacks, AI providers, OAuth issuer, cron, and maintenance mode.
- Investigate the recorded Better Auth connection-pool exhaustion under representative local concurrency. Match pooling configuration to deployment; do not blindly raise connection limits.
- Update PRODUCT.md to the approved flow, ARCHITECTURE.md current-state sections and append-only log after implementation, DESIGN.md's obsolete graph references, AGENTS.md auth basics, README setup/demo/test instructions, `.env.example`, and ROADMAP status. Keep secrets out of all examples.

## 10. Implementation order and gates

| Work package | Deliverable | Exit gate |
|---|---|---|
| 1. Baseline and contracts | Reproducible install, recorded existing test failures, typed readiness/import/connection contracts, migration plan | Existing defects distinguished from new failures; no live data mutation |
| 2. Real client authentication | OAuth discovery/consent/token path, version-compatible MCP transport, preserved API-key clients | Authenticated setup calls from Claude and ChatGPT against isolated endpoint |
| 3. Safe state and persistence | Migrations, typed helpers, readiness derivation, import drafts/commit, source tracking, leases/idempotency | Empty-account commit, retry, rollback, ownership and legacy-account tests pass |
| 4. Guided setup | Consistent auth routing, client-specific instructions, setup prompt, live progress, notes review, compact fallback | Fresh accounts complete setup with no graph flash; refresh resumes each step |
| 5. Memory round trip | Reliable capture/drain, root handling, active-entry context assembly, hierarchy consistency | A saved fact is returned in a separate client/session and removable afterward |
| 6. Dashboard and cleanup | Real refresh, source/status, useful failure states, dead/fake controls removed | Existing-account regression and mobile/keyboard checks pass |
| 7. Release validation | Local E2E evidence, isolated real-client smoke tests, deployment runbook, reconciled docs | All release criteria below met or explicitly reported blocked; no concealed fallback |

Work packages are parts of one implementation iteration, not separately half-shipped public changes. Keep incomplete work on the development branch and deploy the coherent release only after validation.

## 11. Testing and evidence

### Baseline

Run `npm ci`, lint, TypeScript, tests, and production build from the lockfile in a controlled environment. Investigate the prior Vitest temporary-file ENOENT and the non-completing lint/typecheck commands; do not count either as passing or assume they are application bugs. Use dedicated test fixtures/accounts and an isolated database. Never run the production schema/migration scripts as a local test shortcut.

### Unit and database integration

- Readiness for cold, connected-only, review-pending, legacy populated, manual-created, revoked-connection, and last-note-deleted accounts.
- Validation, secret redaction, setup instruction content, no-write-before-approval behavior, and import item editing/selection.
- Root creation races, partial failure rollback, import double-click/replay, normalized dedupe, worker lease expiry/retry, malformed AI output, missing model credentials, and canceled/expired imports.
- Cross-user attempts against every run/item/entry/connection route, anonymous access, forged provider/consent fields, invalid/expired/revoked tokens, wrong audience/scope, OAuth redirect/PKCE failures, and API-key compatibility.
- Full get_context → remember/import → process → get_context/recall → resolve/forget behavior with real isolated persistence, not only mocks of helper internals.
- Parent moves/scope changes, cycles, derived edge repair, source preservation, and context budget/order behavior.

### Browser E2E

Add a maintained browser test runner with a deterministic isolated test server and fixtures. Test real app pages/routes/database with controlled AI responses; mock only external provider boundaries where required.

1. Email signup/verification, Google callback/session boundary, login, and authenticated auth-page navigation resolve to the correct step.
2. Fresh-account dashboard URL redirects before graph mount; setup never displays an empty-dashboard flash.
3. Choose either provider, follow instructions, observe a real protocol call from the test MCP client, submit a draft, review/edit/deselect, commit, and reach populated dashboard.
4. Cancel or decline, zero notes, no accessible client memory, incompatible client account, copy failure, wrong URL, auth failure, network loss, processing failure, refresh, back navigation, and two-tab races all recover.
5. Existing account login, second-client import, reimport, key rotation confirmation, disconnect/reconnect, and last-note deletion preserve intended data/access behavior.
6. Cross-client fact retrieval and note correction/deletion update the UI without a full reload.
7. Test small phone, tablet, laptop, dark/light, reduced motion, keyboard-only operation, focus restoration, screen-reader announcements, and slow-network states.
8. Verify no graph bundle/WebGL work on setup, bounded/stopped polling, retained data during background refresh, and no private content/tokens in captured logs.

### Real ChatGPT/Claude validation

Local protocol/browser tests cannot prove third-party UI integration. Use an isolated preview deployment or supported secure public tunnel to reach the local app; remote web clients cannot call a private localhost server directly.

For each available real client account: create the connector, authorize the correct ContextGraph account, enable it in the conversation, use the setup prompt, correct a proposed fact, decline one import, approve another, observe receipt/progress, review/save notes, then retrieve a new fact from the other client. Verify reconnect and revocation. Do not fabricate chat approval or approve a human-consent step without the user's explicit test authorization. Record untested external steps as untested, including account restrictions.

### Required release evidence

Record command results, browser scenarios, screenshots of meaningful states, measured performance observations, and the exact real-client compatibility matrix. Document known limitations and reproducible failures. A green build alone is insufficient.

## 12. Definition of done

- [x] Both signup methods and returning login use consistent readiness-aware routing (actual Google vendor login remains a release smoke test).
- [x] A cold account sees actionable setup; no empty graph or premature graph load.
- [ ] Claude and ChatGPT hosted-account smoke tests on reachable HTTPS preview. Official instructions and actual local OAuth/MCP exchanges are verified; vendor UI is not.
- [x] Setup shows proposed facts, requests chat transfer approval, receives a draft, and enforces website review before graph activation.
- [x] A compact manual/export fallback works without fabricated data or deleting existing content.
- [x] Accepted notes survive reload and appear in the dashboard and another authenticated protocol client.
- [x] Atomic imports, revision checks, dedupe and worker leases protect replay/concurrency; database tests cover failure paths.
- [x] Imports never reset existing graphs or rotate credentials; populated accounts retain access.
- [x] Resolve/forget, connection revocation, source attribution, and authenticated UI refresh behave truthfully.
- [x] Fake success, dead controls, stale copy, and silent empty-parser success are removed from the supported flow.
- [ ] Release-wide evidence complete: local checks recorded below; actual external-account checks and deployment remain pending.
- [x] Schema migrations and deployment prerequisites are checked in; current-state docs and the Architecture Log match implemented behavior.

## 13. Explicitly deferred

Digital twin/profile sharing, semantic/vector search, a new search-first dashboard, fuzzy dedupe/automatic contradiction resolution, multiple independent graphs, team permissions, public graph sharing, full version history, browser extension, a plugin marketplace/slash-command package, public directory submissions, and a broad visual redesign.

Do not claim unsupported tools are integrated. Preserve API-key compatibility for existing terminal users; promote additional clients only after their setup has been tested. Basic privacy/AI-processing disclosure and functional controls in the supported journey belong in this release; a complete public-launch/legal/account-management program remains later work.

## 14. Deployment and recovery

Before a public release: back up the target database, test migrations against an isolated copy, verify the issuer/base URL/callbacks/email/AI/cron configuration, and use additive/backward-compatible schema changes. Deploy schema before code that requires it. Keep old API-key paths and populated-account access working through the transition.

Run the fresh-account and cross-client smoke tests on preview before promoting production. Verify actual production deployment revision after release. If a release fails, roll back application code to the prior compatible build while retaining additive schema; do not roll back by deleting newly imported user data. A migration/schema rollback requires its own reviewed recovery procedure.

## 15. Implementation record — 2026-10-30

Implemented the recovery scope in the local dev checkout. README contains fresh-install/upgrade instructions, environment setup, isolated verification commands and the release checklist. ARCHITECTURE.md records the changed runtime and appends the decision history. PRODUCT.md describes current behavior; DESIGN.md retains the existing tokens and corrects obsolete graph-library references.

Delivered: readiness-aware auth routing and server guards; guided Claude/ChatGPT setup; real OAuth/PKCE/discovery/consent/refresh/revocation; official MCP transport; reviewed, resumable, additive import transactions; compact manual and line-export fallback; note source/dedupe; reliable active-context assembly; leased/bounded capture processing; authenticated UI refresh; real settings controls; privacy disclosure; dated SQL and a dry-run-first upgrade runner. Retired destructive wizard endpoints and false verification states. Installed the user-approved Impeccable skill update without replacing the product's design system.

Local verification:

| Check | Result and limits |
|---|---|
| Unit + real PostgreSQL integration | 41 tests across six files pass. Disposable database; no production data. |
| Optimized Next.js build | Passes. Build without a running fixture database prints expected loopback connection warnings from provider startup; runtime tests start the real fixture first. |
| Strict TypeScript | Passes. |
| ESLint | Zero errors; four existing marketing image-optimization warnings. |
| npm dependency audit | Zero reported vulnerabilities at verification time. |
| Chromium E2E | Four complete scenarios pass against an optimized build: manual/reload/review/save; real OAuth+MCP import and second-client memory round trip; cancel/invalid input/mobile/ownership/CSRF; actual signup/OTP/sign-out/returning login forms. Production OTP throttling remains enabled; tests wait for its real window. |
| Visual/accessibility | Desktop/mobile chooser, connection, review, OAuth consent and populated Notes view captured. Label association, OTP labels, password-toggle/header-link hit targets and settled theme captures corrected during verification. |
| Setup performance | Dashboard redirects before graph mount; graph is lazy and absent from setup. Setup uses bounded backoff, abortable requests and hidden-tab pause. Browser timings on this busy host are functional observations, not a load/capacity benchmark. |

Local logs/screenshots are in ignored .test-output; browser traces/report are ignored as well because they can contain test-session credentials. CI includes maintained browser coverage. Email/model boundaries are local fixtures; no model-memory access is fabricated.

Final evidence: .test-output/tests-release.log (41 passed), build-ship.log (optimized build), types-final.log, lint-final.log (zero errors), audit-release.log (zero vulnerabilities), e2e-final-verified.log (four full scenarios passed), and e2e-visual-final.log (three focused scenarios passed again after final hit-target/privacy-link corrections). Fresh screenshots cover the desktop/mobile chooser, connection steps, OAuth consent, light/mobile and dark/desktop note review, and populated Notes view. The final focused run explicitly checks that setup has no canvas and that the privacy link remains visible on mobile.

Release gates still open: backup and test the additive upgrade on an isolated production copy; configure stable HTTPS issuer/resource URLs and real email/model credentials; smoke-test actual Google login if enabled and the hosted ChatGPT/Claude connector UIs using the target accounts; deploy preview, verify fresh-account/cross-client behavior, then promote. No live migration, push or deployment was performed by this implementation. Digital twin and the other section 13 items remain deferred.

## 16. Production release — 2026-10-30

The owner authorized direct production deployment. Pushed the recovery code to GitHub, verified the dev CI/preview, then promoted to main; Vercel reported a successful production deployment. Live URL: https://context-graph-amber.vercel.app.

Backed up the public application tables to a private ignored local file. Rehearsed the additive upgrade on a complete copy in a separate schema inside a transaction, verified original data preservation, then rolled the rehearsal back. Applied OAuth/recovery SQL to production with original table counts unchanged. The first live import uncovered missing legacy uniqueness indexes; the follow-up dated migration repairs those without deleting records. The rehearsal now exercises both scope and key-owner upserts, and a regression test covers the previously missing invariants.

Final local suite: 42 passing tests, strict TypeScript, lint with zero errors (four existing marketing image warnings). GitHub CI passed the initial complete release. The live smoke test passed canonical discovery, real login, empty-account dashboard gating, OAuth authorization/consent/PKCE/JWKS, draft-only receipt, reviewed commit, readiness activation, saved-memory retrieval through both OAuth and a separate API-key client, observed connection status and token rejection after disconnect. The synthetic account and its data were removed after testing.

The owner can now verify the deployed experience. Actual Google sign-in and the hosted ChatGPT/Claude conversation UIs remain account-specific manual checks; the live OAuth/MCP smoke verifies our deployed server, not those vendor interfaces. Deferred product scope remains unchanged.
