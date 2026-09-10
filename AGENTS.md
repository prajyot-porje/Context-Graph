# ContextGraph Agent Rules

`AGENTS.md` is the canonical instruction file for this repo. Read it before making any change, whether triggered by a slash command or a raw prompt.

## Documentation Map

Four docs, each with one job. Read the one that matches the question before you guess or re-derive it from code.

| Doc | Read it when... | Do NOT put this here |
|---|---|---|
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Touching auth, DB schema, the MCP endpoint, API routes, any cross-cutting `lib/` module, adding/removing a dependency, or asking "how does X actually work / why was it built this way" | Business rationale, UI tokens |
| **[PRODUCT.md](PRODUCT.md)** | Asking "who is this for / what should this feature do / is this in scope for V1" | Implementation detail, visual tokens |
| **[DESIGN.md](DESIGN.md)** | Writing or reviewing any UI, animation, or layout code | Business rationale, backend logic |
| **AGENTS.md** (this file) | Deciding how to work: which skill to reach for, what's always/never allowed, auth pattern basics | Anything the other three own |

**Every architectural decision gets logged.** ARCHITECTURE.md ends with an append-only Architecture Log. When you make an architectural change — new table, new external service, an auth-model change, a structural refactor, deleting/replacing a core module, a deviation from the documented plan — append a dated entry there before you consider the task done. Don't edit past entries; log reversals as new entries.

## Project

ContextGraph is a cross-AI personal context engine — full product scope in [PRODUCT.md](PRODUCT.md). Short version: users store identity, stack, and project context as a graph; any MCP-compatible AI reads/updates it through a per-user API key.

## Stack

Full detail and rationale in [ARCHITECTURE.md](ARCHITECTURE.md) §2. Summary: Next.js (App Router, TS strict) + Tailwind v4 + Better Auth + Supabase Postgres + `react-force-graph-3d` + Lenis + GSAP + OpenRouter/Gemini, single Vercel deployment (the MCP endpoint lives in this same app — there is no separate Railway or Cloudflare Worker service; if that ever changes, log it in ARCHITECTURE.md, don't just edit a UI snippet).

## Architecture Rules

- Better Auth is the source of truth for sessions and user identity.
- Supabase access is server-side only for user-private data. Never query Supabase directly from client components for private data.
- Do not assume Supabase Auth or `auth.uid()`/RLS exists — tenant isolation here is programmatic (`userId` filtered in every `lib/db.ts` call), not RLS. If a Supabase JWT bridge or RLS policy is added later, log it in ARCHITECTURE.md before relying on it.
- API routes and server actions must authorize with Better Auth (`requireSessionUser()`) or the API-key path (`validateApiKey()`) before reading or writing user data. MCP requests use API-key auth, never Better Auth session cookies.
- Schema changes belong in a checked-in SQL file (`supabase/schema.sql` plus a new dated file for the change) — not an ad-hoc script that only you ran once. Log the change in ARCHITECTURE.md.
- App queries belong in typed server helpers in `lib/db.ts`, not inline in components or routes.

## Skill Index

This repo has ~20 skills installed (`.agents/skills/`, tracked in `skills-lock.json`). Loaded skills auto-trigger from their own descriptions even on a raw prompt with no slash command — but this repo already has a locked, opinionated design system (DESIGN.md) and architecture (ARCHITECTURE.md), so several installed skills would actively fight that if left to trigger freely. Use this table to decide, don't just let the first matching description win.

### Use freely — complementary, not competing with our system

| Job | Skill(s) | Why |
|---|---|---|
| Any GSAP animation code (React) | `gsap-react`, `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-utils`, `gsap-performance` | Official GSAP reference skills, no opinion on visual style — safe with our DESIGN.md motion rules |
| Naming a motion effect you can't describe precisely | `animation-vocabulary` | Reverse-lookup glossary, no design opinion |
| Reviewing motion/animation code for craft quality | `review-animations` | Emil Kowalski's animation-craft bar — quality check, not a competing aesthetic |
| UI polish, component/interaction judgment calls, "does this micro-detail feel right" | `emil-design-eng` | Emil Kowalski's UI-polish philosophy — about craft and invisible details, not a visual language, so it doesn't conflict with our tokens |
| Any Supabase work: queries, RLS, realtime, migrations, auth | `supabase`, `supabase-postgres-best-practices` | Domain-specific correctness skills, no design opinion |
| Large/full-file code generation where truncation is a risk | `full-output-enforcement` | Output-completeness enforcement only |
| End-to-end frontend audit/redesign/polish work, including live-browser iteration | `impeccable` | Already wired into this repo (`.impeccable/live/config.json`, its own hooks) — it audits and iterates against *your* design system rather than imposing its own, so it's safe to lean on for redesign/polish passes |
| Generating reference images for a new marketing/landing section | `imagegen-frontend-web` | Useful for comps before implementation; doesn't touch code |

### Do not let auto-trigger — would fight our locked design system

| Skill | Why excluded here |
|---|---|
| `design-taste-frontend`, `design-taste-frontend-v1` | Generic "anti-slop" visual-direction skill — we already have a specific, locked visual direction (DESIGN.md); letting this pick a direction would contradict it |
| `high-end-visual-design`, `minimalist-ui`, `industrial-brutalist-ui`, `gpt-taste` | Each imposes its own strict aesthetic (e.g. `minimalist-ui` explicitly bans gradients/heavy shadows, which DESIGN.md explicitly requires). Directly conflicting rule sets — never let these override a token in DESIGN.md |
| `stitch-design-taste` | Literally generates new `DESIGN.md` files — could overwrite our design system if triggered. Never use it here |
| `redesign-existing-projects` | Overlaps with `impeccable` but brings its own "premium quality" opinion instead of auditing against ours — prefer `impeccable` |
| `image-to-code` | Codex-specific workflow (generate-image-then-implement); not how this agent works day to day |
| `hallmark` | Same category as the taste skills above — a strong, opinionated anti-generic visual system with its own themes/macrostructures. Would compete with DESIGN.md for control of layout/hero/section rhythm on a locked project. Reserve for its `audit` verb only (scoring existing UI against its 57 anti-slop checks is a useful independent sanity check) — never let it run in default/redesign mode here, that would replace our design system with its own |
| `imagegen-frontend-mobile` | This is a web app, no mobile app surface exists |
| `brandkit` | Only relevant for a one-off logo/brand-deck request, not routine development — use only if explicitly asked for brand assets |

Honest take, since you asked directly: this many overlapping "make it look premium" skills installed at once is the controversial part, not the map itself. The map is the correct fix — without it, whichever skill's description best-matches a given prompt wins by chance, and several of them (`minimalist-ui` vs `industrial-brutalist-ui` vs `gpt-taste` vs our own DESIGN.md) actively disagree with each other on things as basic as "are shadows/gradients allowed." A locked design system project like this one doesn't need four competing taste skills auto-triggering — it needs one audit/polish skill (`impeccable`) and one craft-review skill (`emil-design-eng`/`review-animations`) checking work *against* DESIGN.md, not skills that would replace DESIGN.md's opinion with their own. Consider uninstalling the excluded visual-language skills entirely if they're not being used for a different, undesigned project sharing this skill pool — an unused skill sitting in `skills-lock.json` costs nothing at rest, but a skill that *does* trigger unexpectedly on a raw prompt is a real risk of silently drifting the UI off-brand. This table is the mitigation for keeping them installed; deleting the ones you'll never intentionally reach for is the alternative if the table ever feels fragile.

## Always

- Read DESIGN.md before writing UI code. Read ARCHITECTURE.md before writing routes, database, or auth code.
- Use CSS custom properties for colors, spacing, shadows, radii, and component surfaces.
- Default the app to dark mode; switch themes with `data-theme` on `<html>`.
- Keep spacing on the 4px grid.
- Give every interactive element a visible focus state.
- Keep minimum interactive hit targets at 44×44px.
- Keep TypeScript strict. Avoid `any` unless there's a real boundary that can't be typed yet.

## Never

- Never hardcode hex, rgb, or hsl values inside React component files.
- Never use `transition: all`.
- Never use CSS keyframes for entrance animations that should be handled by GSAP.
- Never use `scroll-behavior: smooth`; use Lenis instead.
- Never expose Supabase service-role keys or Better Auth secrets to the browser.
- Never query Supabase directly from client components for user-private data.
- Never add a second accent color.
- Never use pill-shaped buttons for the primary UI language.

## Frontend Workflow

- Build frontend first with mocked data where backend contracts are still evolving — but delete the mock once the real route lands. (This repo currently has leftover mock files from an earlier pass — see ARCHITECTURE.md's debt list. Don't repeat that.)
- Lock data shapes early: context node, context entry, API key summary, onboarding payload.
- Build layout, typography, states, and responsive behavior before animation polish.
- Keep all complex UI surfaces token-driven so the design system can scale cleanly.

## Graph Notes

- Do not rely on default `react-force-graph-3d`/Three.js styling — everything is theme-driven.
- Use semantic node tiers (root/branch/leaf) in code and styles, matching DESIGN.md's node-tier tokens.
- Refresh `ScrollTrigger` after the graph mounts if layout measurements affect animation.
- Hierarchy currently has two representations (`parent_scope` field and `context_edges` table) that can drift — see ARCHITECTURE.md §8. If you change one, change the other, or fix the drift properly instead of patching around it.
