# ContextGraph Agent Rules

## Canonical Docs
- `AGENTS.md` is the canonical instruction file for this repo.
- `DESIGN.md` is the design system source of truth for UI work.
- `PRD.md` is the product and flow source of truth.
- `.agent/skills/*` are supporting implementation guides.
- If a skill file conflicts with `AGENTS.md`, follow `AGENTS.md`.

## Project
ContextGraph is a cross-AI personal context engine. Users store identity,
agency, and project context as a graph. Any MCP-compatible AI can read and
update this graph through a per-user API key.

## Stack
- Framework: Next.js latest, App Router, TypeScript strict mode
- Styling: Tailwind CSS + CSS custom properties from `DESIGN.md`
- Auth: Better Auth
- Database: Supabase PostgreSQL
- Graph UI: React Flow
- Scroll: Lenis
- Animation: GSAP + ScrollTrigger + CustomEase
- AI judgment: OpenRouter via the `openai` package
- MCP server: deployed separately on Railway, TypeScript + Node.js

## Architecture Rules
- Better Auth is the source of truth for sessions and user identity.
- Supabase access is server-side only for user-private data.
- Do not assume Supabase Auth or `auth.uid()` exists in app code.
- If a Supabase JWT bridge is added later, document it explicitly before using it.
- API routes and server actions must authorize with Better Auth before reading or writing user data.
- MCP requests use API key auth, not Better Auth session cookies.
- Schema changes belong in migrations or checked-in SQL files.
- App queries belong in typed server helpers, not inline in components.

## Suggested File Conventions
```text
/app
  /(marketing)/page.tsx
  /(auth)/login/page.tsx
  /(auth)/signup/page.tsx
  /(app)/dashboard/page.tsx
  /(app)/onboarding/page.tsx
  /(app)/settings/page.tsx
  /api/auth/[...all]/route.ts
  /api/context/route.ts
  /api/context/[id]/route.ts
  /api/mcp/route.ts
  /api/onboarding/route.ts
  /api/apikey/route.ts
  /api/cron/decay/route.ts

/components
  /graph
  /landing
  /dashboard
  /onboarding
  /ui
  /providers

/lib
  /auth
  /db
  /context
  /openrouter
  /animation

/types
```

## Always
- Read `DESIGN.md` before writing UI code.
- Read `.agent/skills/component-patterns.md` before building components.
- Read `.agent/skills/animations.md` before writing GSAP or Lenis code.
- Read `.agent/skills/api-patterns.md` before writing route handlers.
- Read `.agent/skills/database-patterns.md` before writing database code.
- Use CSS custom properties for colors, spacing, shadows, radii, and component surfaces.
- Default the app to dark mode and switch themes with `data-theme` on `<html>`.
- Keep spacing on the 4px grid.
- Give every interactive element a visible focus state.
- Keep minimum interactive hit targets at 44x44px.
- Keep TypeScript strict. Avoid `any` unless there is a real boundary that cannot be typed yet.

## Never
- Never hardcode hex, rgb, or hsl values inside React component files.
- Never use `transition: all`.
- Never use CSS keyframes for entrance animations that should be handled by GSAP.
- Never use `scroll-behavior: smooth`; use Lenis instead.
- Never expose Supabase service role keys or Better Auth secrets to the browser.
- Never query Supabase directly from client components for user-private data.
- Never add a second accent color.
- Never use pill-shaped buttons for the primary UI language.

## Auth Pattern
- Better Auth owns auth tables and session management.
- Use Better Auth middleware and server helpers to protect `/(app)` routes.
- Public routes are `/`, `/login`, and `/signup`.
- User-owned data is authorized from the Better Auth session user id.
- The MCP route validates `x-api-key`, resolves a user id, and scopes all operations to that user.

## Frontend Workflow
- Build frontend first with mocked data where backend contracts are still evolving.
- Lock data shapes early: context node, context entry, API key summary, onboarding payload.
- Build layout, typography, states, and responsive behavior before animation polish.
- Keep all complex UI surfaces token-driven so the design system can scale cleanly.

## Graph Notes
- Import `reactflow/dist/style.css` and override it with design tokens.
- Do not rely on default React Flow node or edge styling.
- Use semantic node tiers such as root, branch, and leaf in code and styles.
- Refresh ScrollTrigger after the graph mounts if layout measurements affect animation.
