import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSessionUser } from '@/lib/auth/server'
import { getUserNodes, createNode, getUserEdges, getUserEntries } from '@/lib/db'
import { requireMutationUser } from '@/lib/api/session'
import { handleRouteError } from '@/lib/api/errors'

const createNodeSchema = z.object({
  scope: z.string().min(1, 'Scope is required').max(120),
  title: z.string().min(1, 'Title is required').max(120),
  content: z.string().max(20000).default(''),
  tags: z.array(z.string().max(60)).max(30).default([]),
  parent_scope: z.string().nullable().default(null),
})

export async function GET() {
  try {
    const user = await requireSessionUser()
    const nodes = await getUserNodes(user.id)
    const edges = await getUserEdges(user.id)
    const entries=await getUserEntries(user.id)
    const ready=nodes.some(n=>n.content.trim().length>0)||entries.length>0
    return NextResponse.json({ nodes, edges, entries, ready })
  } catch (error) {
    return handleRouteError(error, 'GET /api/context')
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireMutationUser(req)
    const body = await req.json()
    const input = createNodeSchema.parse(body)
    const node = await createNode(user.id, input)

    return NextResponse.json({ node }, { status: 201 })
  } catch (error) {
    return handleRouteError(error, 'POST /api/context')
  }
}
