import { NextRequest, NextResponse } from 'next/server'
import {
  validateApiKey,
  checkRateLimit,
  getUserNodes,
  appendEntry,
  stageEntry,
  countUserEntries,
  resolveEntry,
  forgetEntry,
  searchEntries,
  updateLastClientName,
  markOnboardingDone,
} from '@/lib/db'
import { judgeContext } from '@/lib/openrouter'
import { assembleContext } from '@/lib/context'
import { scrubSecrets } from '@/lib/utils'
import { MEMORY_PROTOCOL, VALID_KINDS, buildGetContextReply } from '@/lib/mcp-protocol'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, mcp-session-id, x-api-key, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS })
}

export async function GET() {
  // Support standard GET request for Streamable HTTP SSE check compliance
  return new Response('SSE not supported on this endpoint', { status: 405, headers: CORS })
}

function extractApiKey(request: Request): string | null {
  // 1. Authorization header: "Bearer ctx_..." or raw key
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const cleanAuth = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (cleanAuth) return cleanAuth;
  }

  // 2. Claude Code, Codex, Antigravity — pass key as x-api-key header
  const headerKey = request.headers.get("x-api-key");
  if (headerKey) return headerKey.trim();

  // 3. Claude.ai web, ChatGPT web — pass key as query param (?key=, ?apiKey=, ?api_key=)
  const url = new URL(request.url);
  const paramKey = url.searchParams.get("key") || url.searchParams.get("apiKey") || url.searchParams.get("api_key");
  if (paramKey) return paramKey.trim();

  return null;
}

// ROADMAP.md P1.7 — cheap structured logging so we can later measure
// save-worthy-moments vs. actual tool calls, broken down by client. Not a
// dashboard yet, just Vercel's log stream; upgrade to a real table if/when
// that stops being enough.
function logToolCall(tool: string, clientName: string | null) {
  console.log(`[${new Date().toISOString()}] [MCP TOOL CALL] tool=${tool} client=${clientName ?? 'unknown'}`)
}

export async function POST(req: NextRequest) {
  const apiKey = extractApiKey(req)
  const validated = apiKey ? await validateApiKey(apiKey) : null
  if (!validated) {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32001, message: 'Unauthorized' }, id: null },
      { status: 401, headers: CORS }
    )
  }
  const { userId, apiKeyId, lastClientName } = validated
  const clientName = lastClientName ?? req.headers.get('user-agent')?.slice(0, 100) ?? null

  const withinLimit = await checkRateLimit(apiKeyId)
  if (!withinLimit) {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32000, message: 'Rate limit exceeded. Try again later.' }, id: null },
      { status: 429, headers: CORS }
    )
  }

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null },
      { status: 400, headers: CORS }
    )
  }

  const { method, params, id } = body

  // Handle initialized notifications (Issue 1 compliance)
  if (method === 'notifications/initialized') {
    return new Response(null, { status: 202, headers: CORS })
  }

  // Handle initialize
  if (method === 'initialize') {
    const initClientName: string | undefined = params?.clientInfo?.name
    if (initClientName) {
      // Fire-and-forget — clientInfo only arrives on `initialize`; persisting it
      // lets later calls on this key (remember, etc.) still tag a source.
      updateLastClientName(apiKeyId, initClientName).catch(() => {})
    }

    // ROADMAP.md P1.6: "connected a tool" is what onboarding_done means now, not
    // "filled in the wizard" — a successful MCP handshake is exactly that signal.
    // Idempotent, so no need to check the current value first.
    markOnboardingDone(userId).catch(() => {})

    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'contextgraph', version: '1.0.0' },
        instructions: MEMORY_PROTOCOL,
      },
    }, { headers: CORS })
  }

  // Handle tools/list
  if (method === 'tools/list') {
    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: 'get_context',
            description: 'Call this first, at the start of every session, before doing anything else — it loads the user\'s saved context. Optional scope (e.g. "me", "agency", "personal/{project}"); defaults to "me".',
            inputSchema: {
              type: 'object',
              properties: {
                scope: { type: 'string', description: 'Context scope. Defaults to "me" if omitted.' },
              },
            },
          },
          {
            name: 'remember',
            description: 'Call this immediately whenever the user decides something, states a preference or constraint, or gets stuck on an unresolved problem. Do not wait until the session ends, and do not filter for importance yourself — when in doubt, call it, the server decides what is worth keeping.',
            inputSchema: {
              type: 'object',
              properties: {
                text: { type: 'string', description: 'What happened, in one or two sentences.' },
                kind: { type: 'string', enum: VALID_KINDS, description: 'Best guess at the category. Defaults to "note" if unsure.' },
                scope: { type: 'string', description: 'Which part of the graph this belongs to, e.g. "me" or "personal/{project}". Defaults to "me".' },
              },
              required: ['text'],
            },
          },
          {
            name: 'recall',
            description: 'Search the user\'s saved context in natural language, e.g. "what was I stuck on with auth last week". Use this when the user references something from a previous session that is not in your current context.',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string' },
              },
              required: ['query'],
            },
          },
          {
            name: 'resolve',
            description: 'Mark a previously saved open problem as resolved, now that it is fixed. Pass the entry_id shown by recall or list_nodes.',
            inputSchema: {
              type: 'object',
              properties: {
                entry_id: { type: 'string' },
              },
              required: ['entry_id'],
            },
          },
          {
            name: 'forget',
            description: 'Permanently delete a saved entry — call this when the user explicitly asks to remove or correct something that was remembered. Pass the entry_id.',
            inputSchema: {
              type: 'object',
              properties: {
                entry_id: { type: 'string' },
              },
              required: ['entry_id'],
            },
          },
          {
            name: 'list_nodes',
            description: 'List all context nodes in the graph to see their scopes, titles, tags, and metadata (does not include full content to save tokens).',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      },
    }, { headers: CORS })
  }

  // Handle tools/call
  if (method === 'tools/call') {
    const { name, arguments: args } = params

    if (name === 'get_context') {
      const scope = (args?.scope as string | undefined) || 'me'

      try {
        const [nodes, entryCount] = await Promise.all([getUserNodes(userId), countUserEntries(userId)])
        const assembled = assembleContext(nodes, scope)
        logToolCall('get_context', clientName)

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: buildGetContextReply(assembled, nodes.length, entryCount) }],
          },
        }, { headers: CORS })
      } catch (e) {
        console.error('Failed to get context:', e)
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32000, message: 'Failed to fetch context' },
        }, { headers: CORS })
      }
    }

    if (name === 'remember') {
      const { text, kind, scope } = args || {}
      if (!text || typeof text !== 'string') {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: 'Missing text argument' },
        }, { headers: CORS })
      }

      try {
        const safeText = scrubSecrets(text).slice(0, 1000)
        const kindHint = typeof kind === 'string' && (VALID_KINDS as string[]).includes(kind) ? kind : undefined
        const result = await stageEntry({
          userId,
          rawText: safeText,
          kindHint,
          scopeHint: typeof scope === 'string' ? scope : undefined,
          source: clientName,
        })
        logToolCall('remember', clientName)

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: result.staged ? 'Noted.' : `Skipped (${result.reason}).` }],
          },
        }, { headers: CORS })
      } catch (e) {
        console.error('Failed to stage entry:', e)
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32000, message: 'Failed to save' },
        }, { headers: CORS })
      }
    }

    if (name === 'recall') {
      const { query } = args || {}
      if (!query || typeof query !== 'string') {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: 'Missing query argument' },
        }, { headers: CORS })
      }

      try {
        const results = await searchEntries(userId, query)
        logToolCall('recall', clientName)

        const text = results.length === 0
          ? 'No matching context found.'
          : results.map(r => `[${r.entry.id}] (${r.nodeScope}/${r.entry.kind}, ${r.entry.created_at.slice(0, 10)}) ${r.entry.entry_text}`).join('\n')

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text }] },
        }, { headers: CORS })
      } catch (e) {
        console.error('Failed to search entries:', e)
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32000, message: 'Search failed' },
        }, { headers: CORS })
      }
    }

    if (name === 'resolve') {
      const { entry_id } = args || {}
      if (!entry_id || typeof entry_id !== 'string') {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: 'Missing entry_id argument' },
        }, { headers: CORS })
      }

      try {
        await resolveEntry(entry_id, userId)
        logToolCall('resolve', clientName)
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: 'Marked as resolved.' }] },
        }, { headers: CORS })
      } catch (e) {
        console.error('Failed to resolve entry:', e)
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32000, message: 'Failed to resolve' },
        }, { headers: CORS })
      }
    }

    if (name === 'forget') {
      const { entry_id } = args || {}
      if (!entry_id || typeof entry_id !== 'string') {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: 'Missing entry_id argument' },
        }, { headers: CORS })
      }

      try {
        await forgetEntry(entry_id, userId)
        logToolCall('forget', clientName)
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: 'Deleted.' }] },
        }, { headers: CORS })
      } catch (e) {
        console.error('Failed to forget entry:', e)
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32000, message: 'Failed to delete' },
        }, { headers: CORS })
      }
    }

    if (name === 'list_nodes') {
      try {
        const nodes = await getUserNodes(userId)
        logToolCall('list_nodes', clientName)

        // Format nodes to omit long content to save tokens
        const formattedNodes = nodes.map(node => ({
          id: node.id,
          scope: node.scope,
          title: node.title,
          relevance: node.relevance,
          tags: node.tags,
          parent_scope: node.parent_scope,
          last_updated: node.last_updated,
          created_at: node.created_at,
        }))

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(formattedNodes, null, 2) }],
          },
        }, { headers: CORS })
      } catch (e) {
        console.error('Failed to list nodes:', e)
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32000, message: 'Failed to list nodes' },
        }, { headers: CORS })
      }
    }

    // save_context — superseded by remember (ROADMAP.md P1.5). Not advertised in
    // tools/list, but still handled so any client that already discovered and
    // cached it (before this change) keeps working. Runs its own synchronous LLM
    // judgment, unlike remember's stage-then-batch-judge path.
    if (name === 'save_context') {
      const { summary, scope, goal, achieved } = args || {}
      if (!summary || !scope || !goal || achieved === undefined) {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: 'Missing save_context arguments' },
        }, { headers: CORS })
      }

      const safeSummary = scrubSecrets(String(summary))

      const prompt = `
You are a context engine for a personal AI assistant.
Evaluate if this session summary is worth saving permanently.

Session goal: ${goal}
Goal achieved: ${achieved}
Summary: ${safeSummary}
Scope: ${scope}

Return ONLY JSON, no markdown:
{
  "should_save": boolean,
  "reason": "one sentence",
  "entry": "if should_save: concise bullet starting with ${new Date().toISOString().split('T')[0]}, max 20 words",
  "score": 0.0 to 1.0,
  "target_scope": "which scope to save to",
  "update_node_content": boolean,
  "content_addition": string | null
}

Also determine: should this session update the node's core content field with a new permanent fact? Set update_node_content to true only if a significant permanent fact was revealed — a major architectural decision, a project pivot, a new technology adopted, a role change. Routine progress does NOT qualify. If yes, provide a 1–2 sentence addition as content_addition (written in third person, like the existing node content). If no, set update_node_content to false and content_addition to null.
`
      try {
        const response = await judgeContext(prompt)
        const clean = response.replace(/```json|```/g, '').trim()
        const judgment = JSON.parse(clean)

        if (!judgment.should_save) {
          return NextResponse.json({
            jsonrpc: '2.0',
            id,
            result: {
              content: [{
                type: 'text',
                text: `Not saved. Reason: ${judgment.reason}`,
              }],
            },
          }, { headers: CORS })
        }

        // Find the target node
        const nodes = await getUserNodes(userId)
        const targetNode = nodes.find(n => n.scope === judgment.target_scope)
          ?? nodes.find(n => n.scope === scope)
          ?? nodes.find(n => n.scope === 'me')

        // Cap model-authored text before it's persisted — a hostile page or file the
        // agent read could otherwise inject an oversized or instruction-laden payload
        // into permanent storage (see ARCHITECTURE.md / ROADMAP.md P0.5).
        const MAX_ENTRY_LENGTH = 300
        const entryText = scrubSecrets(String(judgment.entry ?? '')).slice(0, MAX_ENTRY_LENGTH)

        if (targetNode && entryText) {
          await appendEntry(targetNode.id, userId, entryText, judgment.score)
        }

        // A "significant permanent fact" never mutates `content` directly — it's
        // appended as a distinctly-tagged, append-only entry instead. Promoting it
        // into a node's core content is a human action in the dashboard, not
        // something an auto-save can do to itself.
        if (judgment.update_node_content === true && judgment.content_addition && targetNode) {
          const MAX_CONTENT_ADDITION_LENGTH = 500
          const addition = scrubSecrets(String(judgment.content_addition)).trim().slice(0, MAX_CONTENT_ADDITION_LENGTH)
          if (addition) {
            await appendEntry(targetNode.id, userId, `[possible core update] ${addition}`, judgment.score)
          }
        }

        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{
              type: 'text',
              text: `Saved to ${targetNode?.scope ?? 'me'}. Entry: ${judgment.entry} (score: ${judgment.score})`,
            }],
          },
        }, { headers: CORS })
      } catch (e) {
        console.error('AI judgment failed:', e)
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32000, message: 'AI judgment failed' },
        }, { headers: CORS })
      }
    }
  }

  return NextResponse.json({
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: 'Method not found' },
  }, { headers: CORS })
}
