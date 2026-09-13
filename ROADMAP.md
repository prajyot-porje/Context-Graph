# ContextGraph — Product Roadmap

Version 1.0 | Written 2026-09-12

This is the **forward plan**: what we build next, in what order, and why. It is not the current-state reference (see [ARCHITECTURE.md](ARCHITECTURE.md)), not the product scope (see [PRODUCT.md](PRODUCT.md)), and not the visual spec (see [DESIGN.md](DESIGN.md)).

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
