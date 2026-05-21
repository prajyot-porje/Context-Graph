import { NextRequest, NextResponse } from 'next/server'
import { requireSessionUser } from '@/lib/auth/server'
import { getNodeWithEntries } from '@/lib/db'
import { handleRouteError } from '@/lib/api/errors'
import { mockNodes } from '@/lib/mock-data'
import { mockEntries } from '@/lib/mock-entries'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireSessionUser()
    const { id } = await params
    
    // --- DEMO MODE (TEMPORARY) ---
    // Fetch mock node corresponding to this id
    const baseNode = mockNodes.find(n => n.id === id)
    if (!baseNode) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 })
    }

    const node = {
      id: baseNode.id,
      user_id: user.id,
      scope: baseNode.scope,
      title: baseNode.title,
      content: baseNode.content,
      relevance: baseNode.relevance,
      tags: ['demo'],
      parent_scope: baseNode.parent_scope,
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }

    // Map mockEntries to conform to ContextEntry (adding user_id and node_id)
    const rawEntries = mockEntries[id] || []
    const entries = rawEntries.map(entry => ({
      id: entry.id,
      node_id: id,
      user_id: user.id,
      entry_text: entry.entry_text,
      score: entry.score,
      created_at: new Date(entry.created_at).toISOString(),
    }))

    return NextResponse.json({ node, entries })
    // -----------------------------
    
    /* ORIGINAL DB CODE:
    const data = await getNodeWithEntries(id, user.id)
    return NextResponse.json(data)
    */
  } catch (error) {
    return handleRouteError(error, `GET /api/context/[id]/entries`)
  }
}
