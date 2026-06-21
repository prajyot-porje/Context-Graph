# Technical Analysis: ContextGraph Engineering Story & Architectural Deep Dive

This document answers the specific technical questions regarding the architectural design, security models, data pipelines, WebGL rendering fixes, and database statistics of the ContextGraph project.

---

### 1. The Zero-Context Problem: The Core User Pain Point
ContextGraph solves the **"zero-context problem"** in AI-driven development.
* **Who it affects:** Power developers using LLMs (e.g., Claude Code, Cursor, ChatGPT, Claude.ai, Codex) to build software across multiple distinct codebases, clients, or freelance projects.
* **What specifically is broken without it:** 
  1. **Repetitive Onboarding:** Every new chat session or terminal command-line prompt starts with a blank slate. The developer must repeatedly copy-paste or write explanations of their identity, skills, communication preferences, and coding constraints.
  2. **Config Drift and Code Contamination:** In projects involving multiple tech stacks, the AI model gets confused by conflicting style guides, frameworks, or dependencies. Without scope containment, instructions from project A bleed into project B.
  3. **Memory Silos:** Memory features are locked behind platform walled gardens. ChatGPT's memory is inaccessible to Claude Code, which is isolated from Cursor.
  4. **Lack of Structured Hierarchy:** Native memory implementations treat developer context as flat keyword maps or semantic vectors. They cannot represent hierarchical scopes (e.g., distinguishing a developer's global preference from an agency-level constraint or a specific repository's architecture).

---

### 2. Protocol Choice: Model Context Protocol (MCP) vs. Custom REST API
ContextGraph exposes a Next.js-native JSON-RPC 2.0 HTTP endpoint at `/api/mcp` conforming to the Model Context Protocol.
* **Why MCP was chosen over REST:**
  * **Native Client Integration:** Modern AI clients (Claude Desktop, Claude Code, Cursor) natively speak MCP. Exposing an MCP server allows these tools to automatically discover and execute tools without requiring the developer to write custom client-side command-line extensions or wrapper scripts.
  * **Dynamic Context Assembly:** MCP allows the AI to autonomously invoke the `get_context` tool with a specific `scope` argument (e.g., `personal/auth-module`) mid-chat. The client receives dynamically tailored, token-optimized context chunks rather than a dump of all user preferences.
  * **Autocapture of Session History:** Through the `save_context` tool, the AI client writes back to the user's graph directly from the terminal or chat interface at the end of a session, enabling hands-free context recording.
* **What would be lost without the MCP layer:**
  * Without it, ContextGraph would be a standard REST service. The developer would have to manually fetch their profile via `curl`, copy-paste it into the prompt, or build custom extensions for every developer tool. The AI would lose the capability to *autonomously* save and retrieve context from the developer's graph inside the developer tool's runtime loop.

---

### 3. Dual Authentication System: Cookie Sessions + Hashed API Keys
The application implements two distinct authentication schemes:
1. **SaaS Web UI:** Secure browser sessions managed via **Better Auth** (using session cookies with a 7-day expiration).
2. **Remote MCP Clients:** Direct HTTP JSON-RPC calls authenticated via bearer API keys starting with the prefix `ctx_`.
* **Securing Keys via SHA-256 Hashing:**
  * API keys are generated cryptographically using `ctx_` concatenated with a high-entropy 24-byte base64url string:
    ```typescript
    const rawKey = `ctx_${randomBytes(24).toString('base64url')}`
    const hash = createHash('sha256').update(rawKey).digest('hex')
    const prefix = rawKey.slice(0, 12)
    ```
  * Only the `key_hash` (SHA-256 hash) and `key_prefix` are stored in the database. The raw key is shown only once in the browser UI.
* **Attack Vectors & Failure Scenarios Prevented:**
  * **Database Leak / Key Exposure:** If the Supabase database is compromised, attackers cannot retrieve plaintext API keys. Reversing SHA-256 is computationally infeasible, rendering leaked hashes useless.
  * **Cross-Site Request Forgery (CSRF):** Sessions are locked to the browser client. External API requests to `/api/mcp` ignore cookies and require the explicit `x-api-key` header (or URL query parameter `?key=` for web-based AI clients), blocking CSRF exploits.
  * **Session Replay & Key Hijacking:** Decoupling session tokens from API keys allows users to immediately revoke remote keys without destroying their active dashboard sessions.

---

### 4. Multi-Tenancy & Zero-Trust Programmatic Data Isolation
ContextGraph utilizes **Supabase PostgreSQL** as its primary datastore, but with a unique backend constraint:
* **The Challenge:**
  * The Next.js API layer initializes the Supabase client using the `SUPABASE_SERVICE_ROLE_KEY` to perform administrative tasks and bypass database Row Level Security (RLS). 
  * Because RLS is bypassed by the service role key, the database client does not automatically restrict queries to the currently authenticated user.
* **The Naive Leak Scenario:**
  * In a naive implementation, a route handler might fetch context using a simple `.eq('id', nodeId)` filter. If an attacker guesses a node UUID belonging to another user, the server role client would retrieve that user's private context, leaking tenant data.
* **How Data Isolation was Enforced:**
  * **Zero-Trust Programmatic Layering:** Every database function in `lib/db.ts` is strictly typed and mandates a `userId` parameter. Every query enforces programmatic user isolation:
    ```typescript
    const { data, error } = await supabase
      .from('context_nodes')
      .select('*')
      .eq('user_id', userId) // Enforce user context boundary
      .eq('id', nodeId)
    ```
  * **Strict Auth-to-DB Mapping:** The user ID is retrieved directly from Better Auth server-side sessions (`requireSessionUser()`) or API key SHA-256 lookups (`validateApiKey()`). This ID is then strictly propagated down to the database helper methods, ensuring data isolation.

---

### 5. The 5-Model OpenRouter Cascade & AI Judgment Layer
ContextGraph uses OpenRouter's free tier cascade in `lib/openrouter.ts` to perform structured AI evaluations at zero API cost.
* **The Cascade Path:**
  ```typescript
  const MODEL_CASCADE = [
    'minimax/minimax-m2.5:free',
    'qwen/qwen3-next-80b-a3b-instruct:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemma-4-26b-a4b-it:free',
    'google/gemma-4-31b-it:free',
  ]
  ```
  The system attempts to call the models sequentially. If it encounters a transient error (such as a `429` rate limit, a `404` model deprecation, or a `502`/`503` gateway timeout), it catches the warning and falls back to the next model. Non-transient errors (e.g., authentication) trigger an immediate failure.
* **"Warranting Persistence" Rubric:**
  * When a developer runs `/save` in an AI client, the summary is parsed by the active cascade model. The AI evaluates:
    1. **Goal Achievement:** Did the developer accomplish the session goal?
    2. **Factual Integrity:** Does the summary introduce permanent engineering facts (e.g., architectural decisions, project pivots, tech stack changes)?
    3. **Trivial Progress Filter:** Minor modifications, bug fixes, or documentation corrections are rejected to prevent graph pollution.
  * The model outputs a JSON payload with:
    * `should_save` (Boolean): If `true`, creates a new record in `context_entries`.
    * `score` (Float, `0.0` - `1.0`): The judged importance of the modification.
    * `update_node_content` (Boolean): If a major architectural fact or preference is established, this triggers a permanent update of the core node content.
* **Low-Scoring Summaries:**
  * Summaries rejected by the AI (`should_save: false`) are discarded. The API returns `Not saved. Reason: <reason>` to the developer's console without writing to the database.

---

### 6. The 8% Weekly Exponential Decay Engine
Context relevance is managed using a scheduled weekly Vercel Cron job targeting `app/api/cron/decay/route.ts`.
* **Why 8%:**
  * Stale nodes (nodes not updated in over 30 days) are multiplied by a decay coefficient of `0.92` (an 8% reduction) each week, down to a minimum floor of `0.1`.
  * This decay rate was selected to represent the natural cognitive fading of engineering projects.
* **What Happens Over 4 Weeks:**
  * Without updates, a stale node's relevance decays to \( 0.92^4 \approx 71.6\% \) of its original value.
  * **If Decay Didn't Exist:**
    1. **Context Bloating / Prompt Drift:** The `assembleContext` helper enforces a `maxTokens` (default 4000) limit. Without decay, completed or abandoned projects would permanently occupy token space, pushing out active context nodes.
    2. **Loss of Visual Focus:** The 3D dashboard dims nodes below certain relevance thresholds (e.g., muted borders/texts for relevance below 0.7, archived styles below 0.4). Without decay, every node would look equally active, making it impossible to see current hot areas of focus.

---

### 7. Interactive 3D Graph (WebGL / react-force-graph-3d)
The dashboard displays the user's context structures in an interactive 3D WebGL force-directed layout in `components/graph/ContextGraph3D.tsx`.
* **What it shows:**
  * **Nodes:** Context scopes. Node size is calculated based on depth and relevance: `size = base_size + relevance * 2`.
    * Root node (`me`) is rendered in bright Electric Lime (`#b3ec13`).
    * Depth 1 nodes (e.g., agencies or main tech stacks) are white/light.
    * Depth 2+ nodes (projects) are rendered in secondary gray (`#888888`).
  * **Edges:** Connections representing hierarchy (e.g., `personal/project-slug` is connected to `me` via a `part_of` relationship).
* **Interactive Actions:**
  * **Orbit, Pan, Zoom:** Drag the canvas to rotate, right-click to pan, and scroll to zoom. Or use the toolbar overlay controls.
  * **Hover:** Highlights the target node and displays an absolute-positioned HTML tooltip listing the scope, relevance percentage, and the `last_updated` date.
  * **Click:** Selects the node to open details in the sidebar panel.
  * **Drag:** Drags individual nodes in 3D space to inspect structural clusters (uses d3 spring physics, resetting positions on drag end).

---

### 8. WebGL Pointer-Event Desync: The OrbitControls Drag Bug
* **The Bug:**
  * When dragging nodes in the WebGL canvas, the application frequently crashed with a TypeError: `Cannot read properties of undefined (reading 'x')` originating inside Three.js's `OrbitControls`.
* **The Root Cause:**
  * When dragging a node, the library's `DragControls` intercepts pointer events. Under certain drag trajectories, the browser triggers a `pointercancel` event.
  - `OrbitControls` listens for this event globally on the canvas to clean up its pointer tracking array. Since the drag operation had already cleaned up the pointer state, OrbitControls' lookup returned `undefined`.
  - The internal `onPointerUp` handler inside `OrbitControls` immediately tried to read `.x` or `.y` properties of the undefined pointer reference, causing a runtime crash.
* **The Fix:**
  * Custom node drag hooks were implemented to toggle the active state of `OrbitControls` dynamically:
    ```typescript
    const handleNodeDrag = useCallback(() => {
      const fg = graphRef.current
      if (!fg) return
      const controls = fg.controls()
      if (controls && controls.enabled) {
        controls.enabled = false // Disable OrbitControls during dragging
      }
    }, [])

    const handleNodeDragEnd = useCallback((node: any) => {
      if (node) {
        node.fx = undefined; node.fy = undefined; node.fz = undefined;
      }
      const fg = graphRef.current
      if (!fg) return
      const controls = fg.controls()
      if (controls) {
        controls.enabled = true // Re-enable OrbitControls when drag ends
      }
    }, [])
    ```
  * By disabling `OrbitControls` during node drags, we prevent it from processing pointer events during drag operations, avoiding the stale-pointer lookup and eliminating the crash.

---

### 9. Database Stats & Scale Data
* **Total Registered Users/Tenants:** **3 users**
  * Active User: `Prajyot Porje` (`porjeprajyot@gmail.com`) - `onboarding_done: true`
  * Test Users: 2 accounts (`testuser@contextgraph.com`, `newtestuser@contextgraph.com`) - `onboarding_done: false`
* **Total Context Nodes Stored:** **9 nodes**
  * Scope layout includes `me`, `agency-stack`, `personal-interests`, `context-graph`, `memory-bridge`, and `vercel-cron-decay`.
* **Total Context Entries Stored:** **10 entries** (e.g., profiles, tech stack initializations, and canvas upgrades).
* **Total Active API Keys:** **3 active keys** (SHA-256 hashed, with prefixes like `ctx_wfupQOGT`, `ctx_x54hC5SL`, and `ctx_t3DNBiC4`).
* **Active Connections:** The key `ctx_t3DNBiC4...` is actively serving remote client MCP connections, with its `last_used` timestamp updated on `2026-06-19 05:36:00.344`.

---

### 10. The Most Important Architectural Decision: Programmatic Isolation over Database-Level RLS
The most important decision was **decoupling API authentication (remote MCP JSON-RPC) from browser cookie sessions** and implementing **programmatic tenant filtering** at the Next.js API layer.
* **Why it was made:**
  * If the project had relied on Supabase Row Level Security (RLS) linked to Supabase Auth (`auth.uid()`), the remote MCP clients (which connect via bearer API keys over HTTP without cookie headers) would have failed to authenticate. 
  * Generating custom JWTs on the fly for remote clients to satisfy database-level RLS policies would have introduced massive latency, token signing overhead, and session synchronization issues.
* **The Consequences of a Different Path:**
  * Had we used database-level RLS, we would have been forced to either store plaintext keys in DB tables (a massive security risk), or run a duplicate auth server to bridge Better Auth sessions and Supabase Auth. Programmatic filtering allowed us to use the `SUPABASE_SERVICE_ROLE_KEY` safely server-side, securing the system with a zero-trust model while keeping the authentication layers simple and modular.

---

### 11. Engineering Proficiency Demonstrated
The codebase demonstrates several key engineering skills:
1. **Zero-Trust Multi-Tenancy:** Proper design of cryptographic API key storage (SHA-256 hashing) combined with manual programmatic database scoping, preventing data leaks.
2. **WebGL Lifecycle Management:** Deep understanding of browser event handling (desync pointer-event bug fix between OrbitControls and DragControls), and clean Next.js integration using dynamic SSR-disabled canvas components.
3. **Resilient System Design:** Implementing the 5-model failover API cascade. Instead of simple try/catch blocks, the cascade actively manages API rate limits (`429`), deprecations (`404`), and gateway failures (`502`/`503`) across multiple models.
4. **Clean Protocol Engineering:** Writing a compliant MCP JSON-RPC 2.0 interface directly inside Next.js API endpoints, handling initializations, notifications, tools list, and tool calls.
5. **Decay and Optimization Engines:** Implementing cron-based mathematical decay of relevance scores to prevent prompt bloat and maintain visual focus.
