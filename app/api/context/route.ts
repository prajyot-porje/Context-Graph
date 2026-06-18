import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSessionUser } from '@/lib/auth/server'
import { getUserNodes, createNode, getUserEdges, createEdge } from '@/lib/db'
import { createSupabaseServer } from '@/lib/supabase'
import { handleRouteError } from '@/lib/api/errors'

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
    const nodes = await getUserNodes(user.id)
    const edges = await getUserEdges(user.id)
    return NextResponse.json({ nodes, edges })
  } catch (error) {
    return handleRouteError(error, 'GET /api/context')
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSessionUser()
    const body = await req.json()
    const input = createNodeSchema.parse(body)
    const node = await createNode(user.id, input)

    if (input.parent_scope) {
      const supabase = createSupabaseServer()
      const { data: parentNode } = await supabase
        .from('context_nodes')
        .select('id')
        .eq('user_id', user.id)
        .eq('scope', input.parent_scope)
        .single()

      if (parentNode) {
        await createEdge(supabase, user.id, node.id, parentNode.id, 'part_of')
      }
    }

    return NextResponse.json({ node }, { status: 201 })
  } catch (error) {
    return handleRouteError(error, 'POST /api/context')
  }
}
