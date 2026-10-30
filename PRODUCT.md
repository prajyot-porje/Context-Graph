# ContextGraph — Product

Updated October 30, 2026. Product scope and behavior; implementation belongs in ARCHITECTURE.md, visual rules in DESIGN.md, work rules in AGENTS.md, and forward planning in ROADMAP.md.

## What it is

A personal context engine for developers who switch between AI tools. Users own a graph of identity, preferences, project context, decisions, constraints, and open problems. Connected AI tools can retrieve that context and suggest useful notes as work progresses.

The core demonstration is simple: approve context from one AI, then retrieve it from another without re-explaining it. The product does not promise access to every native memory or complete conversation history of an external provider.

## Audience and personality

Primary users are developers and AI power users working across tools and ongoing projects. Secondary users include freelancers managing client context; shared team permissions are not implemented. Voice is direct, precise, technical, and understated. The existing dark-dominant design system stays in place.

## Setup and return flow

Sign in → choose Claude or ChatGPT → configure its connector → approve selected facts in that conversation → review/edit the received draft in ContextGraph → save → dashboard.

- New or empty accounts see guided setup, never a blank graph. Dashboard access depends on actual meaningful saved context, not a handshake or a stale onboarding flag.
- Existing populated accounts open the dashboard directly. Interrupted setup resumes from stored state.
- Connecting gives the AI tools it can call; it does not give ContextGraph access to the AI account. The website provides current instructions and a copyable natural-language setup prompt. It cannot command an idle external conversation to export memory.
- The model must propose facts, allow corrections, and ask permission before transmitting. Drafts remain separate from the active graph; website review is the authoritative save boundary.
- No useful memories or unavailable connectors: use a compact Create context graph editor or paste a memory export, then review. No invented example profile is saved.
- Import more from the dashboard without deleting existing context or replacing credentials. One graph per account in this release.

## Dashboard and ongoing use

The dashboard presents the real graph, node content, saved notes, provenance, and context preview. A notes view provides an alternative to WebGL. Active saved notes appear as connected leaves grouped by their existing categories; selecting a leaf reveals the full note without creating duplicate stored facts. Existing context scopes support editing and deletion. The sidebar has no Add Node action; users add context through reviewed imports or manual setup. Notes can be deleted, and open problems marked resolved.

get_context loads approved core content and active notes. Automatic capture can suggest decisions, preferences, constraints, and unresolved problems; Settings visibly enables/pauses it. Queued processing and failures are shown truthfully. Keyword recall is available; semantic recall is not yet implemented. Legacy save_context calls work for existing clients, but manual /save is not the required product path.

## Connections and account controls

Claude and ChatGPT are the primary guided clients. Web setup uses OAuth. Existing terminal clients retain header API keys. Instructions must be dated, linked to official sources, and verified on actual target accounts before claiming hosted-client compatibility. Workspace restrictions and clients with no accessible memories need explicit fallback guidance.

Connection success means observed authenticated client activity, not a website preview request. Client names are self-reported. Disconnecting preserves saved notes and revokes the client's access. API keys are shown only when created and are replaced only through an explicit user action.

Account name/email are displayed read-only. Profile editing, full account deletion, and downloadable export remain unavailable in this demo. Do not show no-op success messages or dead destructive controls. The privacy page explains storage, provider processing, draft retention, and available deletion controls without claiming end-to-end encryption.

## Required quality

- A clear next action on every setup screen; no empty-graph flash, fake verification, fake progress, or silent empty import success.
- Preserve context and credentials through repeated imports, retries, refreshes, and concurrent requests.
- Responsive layouts, readable text, keyboard access, visible focus, reduced motion, and dark/light behavior against DESIGN.md.
- Keep graph/WebGL work out of setup. Use bounded authenticated refresh and keep existing content visible during background refresh.
- Validate local OAuth/MCP and persistence end to end. Distinguish local protocol fixtures from actual vendor chat UI smoke tests.

## Deferred

Semantic search and a search-first dashboard; fuzzy duplicate merging and automatic contradiction superseding; multiple independent graphs; teams and scoped sharing; version history; public sharing; marketplace/CLI packaging; directory publication; digital twin; and broad visual redesign. Full public-launch legal/account-management work follows the demo recovery.

## Success criteria

1. A new account follows useful setup rather than seeing an empty dashboard.
2. The user controls what leaves a client and what becomes permanent context.
3. Saved notes survive refresh and are returned to another connected client.
4. Automatic capture is fast on the tool path, reviewable, pausable, and recoverable after processing failure.
5. Deletion, resolution, and connection revocation have real observable effects.
