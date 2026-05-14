# ContextGraph — Product Requirements Document
Version 1.0 | Author: Prajyot Porje | 2026-05-08

---

## What It Is

ContextGraph is a cross-AI personal context engine. It stores who you are, what you build, and how you work as a graph in a database. Any MCP-compatible AI (Claude, ChatGPT, Codex, Cursor) reads this graph at the start of a session and updates it when you type `/save`. The web dashboard lets you see and manage the graph visually.

---

## Problem

Every AI session starts from zero. Users re-explain themselves, their projects, and their preferences every time — across every tool. There is no cross-AI, user-owned, portable memory. Existing solutions (Claude memory, ChatGPT memory) are siloed, black-box, and non-portable.

---

## Solution

A structured context graph owned by the user. Accessible to any AI via MCP protocol and a personal API key. Self-updating after sessions via an AI judgment layer. Visualized as an interactive graph in a web dashboard.

---

## User

Developers and AI power users who use multiple AI tools daily, work on multiple ongoing projects, and already understand MCP configuration. Secondary: freelancers and agency owners managing client context.

---

## Phase History

**Phase 1 — Done.** Personal MCP server in TypeScript + Node.js. Two tools: `get_context` (reads GitHub markdown files by scope) and `save_context` (AI judgment + GitHub commit). Deployed on Railway. Connected to Claude.ai, Claude desktop, and Claude Code.

**Phase 2 — Skipped.** Moving directly to Phase 3 (SaaS).

**This PRD covers Phase 3.**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js latest, App Router, TypeScript |
| Hosting | Vercel |
| Auth | Better Auth |
| Database | Supabase (PostgreSQL, server-side access for V1) |
| Graph UI | React Flow |
| Scroll | Lenis |
| Animation | GSAP + ScrollTrigger |
| MCP server | Railway (existing, extended for multi-user) |
| AI judgment | OpenRouter (google/gemma-4-31b-it:free) |
| Styling | Tailwind CSS + CSS custom properties |

**Monthly cost: $0**

---

## Database Schema

Better Auth owns identity tables such as `user`, `session`, `account`, and
verification tables.

App tables:

**context_nodes** - id, user_id, scope, title, content, relevance, tags,
parent_scope, last_updated, created_at

**context_entries** - id, node_id, user_id, entry_text, score, created_at

**api_keys** - id, user_id, key_hash, key_prefix, created_at, last_used

V1 app access is server-side only. User ownership is enforced from the Better
Auth session user id in API routes and server code. Do not assume Supabase
`auth.uid()` unless a dedicated Better Auth to Supabase JWT bridge is added
later.

---

## Pages

| Route | Auth | Purpose |
|---|---|---|
| / | Public | Landing page |
| /login | Public | Email + password login |
| /signup | Public | Email + password signup |
| /onboarding | Protected | First-time context setup |
| /dashboard | Protected | Main graph view |
| /settings | Protected | API key + account |

---

## API Routes

| Route | Auth Type | Purpose |
|---|---|---|
| /api/auth/[...all] | — | Better Auth handler |
| /api/context | Session | Get/create nodes |
| /api/context/[id] | Session | Update/delete node |
| /api/mcp | API Key | MCP Streamable HTTP endpoint |
| /api/onboarding | Session | Generate initial graph via AI |
| /api/apikey | Session | Generate/revoke API key |
| /api/cron/decay | Cron secret | Weekly relevance decay |

---

## User Flows

### Signup
Email + name + password → Better Auth creates user → API key auto-generated and shown once → redirect to onboarding.

### Onboarding
Four-step form: (1) identity, (2) skills and stack, (3) current projects, (4) goals. On submit → POST to /api/onboarding → OpenRouter generates initial context nodes → written to Supabase → redirect to dashboard. Never shown again after completion.

### Dashboard
Left sidebar (node tree) + main React Flow canvas + right detail panel (opens on node click). Sidebar lets you add nodes. Canvas shows the graph with edges computed from parent_scope. Detail panel shows content, decisions log, relevance score bar, edit/delete actions.

### Session Update Flow
Type `/save` in any connected AI → AI calls `save_context` → hits /api/mcp → API key validated → OpenRouter judges if worth saving → if yes, writes to context_entries, updates node relevance → AI confirms saved or explains skip.

### Settings
View API key prefix. Copy pre-filled connection config snippets for Claude, Claude Code, ChatGPT, Codex. Regenerate key (with confirmation). Update name/email/password. Delete account.

---

## MCP Endpoint Architecture

`/api/mcp` — Streamable HTTP. Auth via `x-api-key` header. Hashes incoming key, looks up in api_keys table, gets user_id. Runs tools against that user's context_nodes. Two tools: `get_context(scope)` and `save_context(summary, scope, goal, achieved)`. Session management via `mcp-session-id` header and server-side Map. CORS headers on all responses.

---

## Features

### Must Have (V1)
- Email/password auth via Better Auth
- Onboarding flow generating initial context graph via OpenRouter
- Dashboard with React Flow graph visualization
- Node detail panel (view, edit, delete)
- Create new nodes from dashboard
- /api/mcp with `get_context` and `save_context`
- API key generation on signup, shown once
- Key regeneration and copy in settings
- Connection snippets for Claude, Claude Code, ChatGPT desktop, Codex
- Weekly relevance decay via Vercel Cron
- Dark and light mode

### Post V1
- AI memory export parsing (ChatGPT/Claude memory → context graph)
- Multiple API keys with labels
- Node version history
- Public read-only graph sharing
- Chrome extension for automatic context injection

---

## Build Order

**Week 1**
- Day 1: Next.js scaffold, Better Auth, Supabase schema, middleware
- Day 2: API key generation on signup, settings page skeleton
- Day 3: Onboarding form + /api/onboarding + OpenRouter call
- Day 4: Dashboard layout + React Flow graph rendering
- Day 5: Node detail panel + CRUD operations
- Day 6: /api/mcp endpoint + MCP Inspector test
- Day 7: Connection snippets + Vercel Cron + Vercel deploy

---

## Success Criteria

The project is complete when a user can:
1. Sign up and complete onboarding
2. See their context graph in the dashboard
3. Connect any MCP-compatible AI using their API key
4. Start a session where `get_context` loads their context automatically
5. Type `/save` and see the new entry appear in the dashboard graph
