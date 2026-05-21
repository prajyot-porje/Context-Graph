import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSessionUser } from '@/lib/auth/server'
import { getUserNodes, createNode } from '@/lib/db'
import { handleRouteError } from '@/lib/api/errors'
import { mockNodes } from '@/lib/mock-data'

const createNodeSchema = z.object({
  scope: z.string().min(1, 'Scope is required'),
  title: z.string().min(1, 'Title is required'),
  content: z.string().default(''),
  tags: z.array(z.string()).default([]),
  parent_scope: z.string().nullable().default(null),
})

export async function GET() {
  try {
    const user = await requireSessionUser()
    
    // --- DEMO MODE (TEMPORARY) ---
    // Instead of querying the database, we map the mockNodes to conform to ContextNode
    const nodes = mockNodes.map(node => ({
      id: node.id,
      user_id: user.id,
      scope: node.scope,
      title: node.title,
      content: node.content,
      relevance: node.relevance,
      tags: ['demo'],
      parent_scope: node.parent_scope,
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }))
    
    return NextResponse.json({ nodes })
    // -----------------------------
    
    /* ORIGINAL DB CODE:
    const nodes = await getUserNodes(user.id)
    return NextResponse.json({ nodes })
    */
  } catch (error) {
    return handleRouteError(error, 'GET /api/context')
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSessionUser()
    const body = await req.json()
    const input = createNodeSchema.parse(body)
    
    // --- DEMO MODE (TEMPORARY) ---
    const node = {
      id: Math.random().toString(36).substring(2, 9),
      user_id: user.id,
      scope: input.scope,
      title: input.title,
      content: input.content,
      relevance: 0.8,
      tags: input.tags,
      parent_scope: input.parent_scope,
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
    return NextResponse.json({ node }, { status: 201 })
    // -----------------------------

    /* ORIGINAL DB CODE:
    const node = await createNode(user.id, input)
    return NextResponse.json({ node }, { status: 201 })
    */
  } catch (error) {
    return handleRouteError(error, 'POST /api/context')
  }
}
