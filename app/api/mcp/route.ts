import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, getUserNodes, appendEntry } from '@/lib/db'
import { judgeContext } from '@/lib/openrouter'
import { assembleContext } from '@/lib/context'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, mcp-session-id, x-api-key',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS })
}

export async function GET() {
  // Support standard GET request for Streamable HTTP SSE check compliance
  return new Response('SSE not supported on this endpoint', { status: 405, headers: CORS })
}

function extractApiKey(request: Request): string | null {
  // Claude Code, Codex, Antigravity — pass key as header
  const headerKey = request.headers.get("x-api-key");
  if (headerKey) return headerKey;

  // Claude.ai web, ChatGPT web — pass key as ?key= query param
  const url = new URL(request.url);
  const paramKey = url.searchParams.get("key");
  if (paramKey) return paramKey;

  return null;
}

async function getAuthenticatedUserId(req: NextRequest): Promise<string | null> {
  const apiKey = extractApiKey(req);
  if (!apiKey) return null;
  return validateApiKey(apiKey);
}

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req)
  if (!userId) {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32001, message: 'Unauthorized' }, id: null },
      { status: 401, headers: CORS }
    )
  }

  let body
  try {
    body = await req.json()
  } catch (e) {
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
    return NextResponse.json({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'contextgraph', version: '1.0.0' },
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
            description: 'Retrieve assembled context from the context graph. Supports scopes: "me", "agency", "agency/{project}", "personal/{project}".',
            inputSchema: {
              type: 'object',
              properties: {
                scope: { type: 'string', description: 'Context scope' },
              },
              required: ['scope'],
            },
          },
          {
            name: 'save_context',
            description: 'Evaluate a session summary and save it to the context graph if worth keeping.',
            inputSchema: {
              type: 'object',
              properties: {
                summary: { type: 'string' },
                scope: { type: 'string' },
                goal: { type: 'string' },
                achieved: { type: 'boolean' },
              },
              required: ['summary', 'scope', 'goal', 'achieved'],
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
      const { scope } = args || {}
      if (!scope) {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: 'Missing scope argument' },
        }, { headers: CORS })
      }
      
      try {
        const nodes = await getUserNodes(userId)
        
        // Assemble context based on scope
        const assembled = assembleContext(nodes, scope)
        
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: assembled }],
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

    if (name === 'save_context') {
      const { summary, scope, goal, achieved } = args || {}
      if (!summary || !scope || !goal || achieved === undefined) {
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: 'Missing save_context arguments' },
        }, { headers: CORS })
      }

      const prompt = `
You are a context engine for a personal AI assistant.
Evaluate if this session summary is worth saving permanently.

Session goal: ${goal}
Goal achieved: ${achieved}
Summary: ${summary}
Scope: ${scope}

Return ONLY JSON, no markdown:
{
  "should_save": boolean,
  "reason": "one sentence",
  "entry": "if should_save: concise bullet starting with ${new Date().toISOString().split('T')[0]}, max 20 words",
  "score": 0.0 to 1.0,
  "target_scope": "which scope to save to"
}
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

        if (targetNode) {
          await appendEntry(targetNode.id, userId, judgment.entry, judgment.score)
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
