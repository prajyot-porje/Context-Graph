# ContextGraph — Product

Version 2.0 | Consolidated 2026-09-05 (supersedes PRD.md, PRODUCT_DOCUMENT.md, technical_answers.md)

This is the business/product source of truth: who we build for, what problem we solve, what the product must do, and how it should feel. For how it's actually built, see [ARCHITECTURE.md](ARCHITECTURE.md). For exact visual tokens/rules, see [DESIGN.md](DESIGN.md).

---

## What It Is

ContextGraph is a cross-AI personal context engine. It stores who you are, what you build, and how you work as a graph in a database. Any MCP-compatible AI (Claude, ChatGPT, Codex, Cursor) reads this graph at the start of a session and updates it when you type `/save`. The web dashboard lets you see and manage the graph visually.

## Problem

Every AI session starts from zero. Developers using multiple AI tools across multiple projects or clients repeatedly re-explain who they are, what stack a project uses, and what's already been decided. Existing memory features (ChatGPT memory, Claude memory) are siloed per-platform, non-portable, and flat — they can't represent a hierarchy (a global preference vs. an agency-level constraint vs. one repo's architecture). Without scope containment, instructions from one project bleed into another.

## Solution

A structured context graph, owned by the user, accessible to any AI via MCP protocol and a personal API key. Self-updating after sessions via an AI judgment layer that decides what's actually worth remembering. Visualized as an interactive 3D graph in a web dashboard.

## Users

Primary: developers and AI power users who use multiple AI tools daily, work across multiple ongoing projects, and already understand MCP configuration.

Secondary: freelancers and agency owners managing context for multiple clients.

## Phase History

- **Phase 1 — Done.** Personal MCP server, TypeScript + Node.js, GitHub-markdown backed. Two tools (`get_context`, `save_context`). Connected to Claude.ai, Claude Desktop, Claude Code.
- **Phase 2 — Skipped.** Moved directly to Phase 3.
- **Phase 3 — This product.** Multi-user SaaS: Supabase-backed graph, Better Auth accounts, web dashboard, per-user API keys.

## Brand Personality

- **Voice**: Direct, precise, technical, understated.
- **Personality**: Cinematic, dark-dominant, expert.
- **Emotional goal**: Structured clarity, security, developer control.

## Anti-references

- **Generic SaaS/AI boilerplate**: warm sand/cream/beige backgrounds, gradient text, tracked-uppercase eyebrows on every section, side-stripe card borders.
- **Corporate/enterprise navy**: generic flat tables, deep navy admin-panel templates, over-complex settings menus.
- **Superficial motion**: bounce/elastic eases, scroll-hijacking, animation without a clear trigger or structural purpose.

(Design principles, accessibility standards, and all visual tokens that implement this personality live in [DESIGN.md](DESIGN.md) — not duplicated here.)

## Pages & Flows

| Route | Auth | Purpose |
|---|---|---|
| `/` | Public | Landing page |
| `/login`, `/signup` | Public | Email + password |
| `/onboarding` | Protected | First-time context setup — a 5-step wizard, not a chat (see ARCHITECTURE.md log) |
| `/dashboard` | Protected | Main graph view |
| `/settings` | Protected | API key + account |
| `/connect` | Protected | MCP connection setup guide per client |

**Signup** → Better Auth creates user → API key auto-generated, shown once → onboarding.

**Onboarding** → a short wizard collects identity, stack, active projects, and goals as real form fields (with an optional first step to import an existing ChatGPT/Claude memory export, which prefills the rest) → AI writes the graph node content from those answers → API key issued → a guided tour on `/connect` walks through connecting an AI client → dashboard.

**Dashboard** → sidebar node tree + 3D graph canvas + detail panel on node click (content, decisions log, relevance bar, edit/delete). Add nodes from the sidebar.

**Session update (`/save`)** → in any connected AI, user types `/save` → AI calls `save_context` → AI judgment decides if it's worth keeping → if yes, entry appears in the dashboard graph with an updated relevance score; if no, the AI explains why it skipped it.

**Settings** → view API key prefix, copy connection snippets per client, regenerate key (with confirmation), manage account.

## Features

### Must Have (V1)
- Email/password auth
- Conversational onboarding generating an initial context graph
- Dashboard with interactive graph visualization
- Node detail panel (view, edit, delete), create nodes from dashboard
- `/api/mcp` with `get_context`, `save_context`, `list_nodes`
- API key generation, regeneration, and per-client connection snippets
- Weekly relevance decay
- Dark and light mode

### Not yet real (tracked, not hidden)
- Account tab in Settings (name/email edit, account deletion) — UI exists, nothing is wired up yet
- Rate limiting on the MCP endpoint — table exists, nothing enforces it

### Post V1 Roadmap
- AI memory export parsing (ChatGPT/Claude memory → context graph) as a first-class import, not just the ad-hoc paste-in currently in onboarding
- Multiple API keys with labels and scoped permissions (e.g. a read-only key for a docs bot)
- Node version history
- Public read-only graph sharing (e.g. share one project's context with a client)
- Browser extension that auto-injects active context into web-based chat UIs

## Success Criteria

The project is complete when a user can:
1. Sign up and complete onboarding
2. See their context graph in the dashboard
3. Connect any MCP-compatible AI using their API key
4. Start a session where `get_context` loads their context automatically
5. Type `/save` and see the new entry appear in the dashboard graph
