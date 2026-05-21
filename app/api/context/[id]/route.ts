import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSessionUser } from '@/lib/auth/server'
import { updateNode, deleteNode } from '@/lib/db'
import { handleRouteError } from '@/lib/api/errors'
import { mockNodes } from '@/lib/mock-data'

const updateNodeSchema = z.object({
  title: z.string().min(1).optional(),
  scope: z.string().min(1).optional(),
  content: z.string().optional(),
  relevance: z.number().min(0).max(1).optional(),
  tags: z.array(z.string()).optional(),
  parent_scope: z.string().nullable().optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireSessionUser()
    const { id } = await params
    const body = await req.json()
    const input = updateNodeSchema.parse(body)
    
    // --- DEMO MODE (TEMPORARY) ---
    const baseNode = mockNodes.find(n => n.id === id)
    const node = {
      id,
      user_id: user.id,
      scope: input.scope ?? baseNode?.scope ?? 'demo',
      title: input.title ?? baseNode?.title ?? 'Demo Node',
      content: input.content ?? baseNode?.content ?? '',
      relevance: input.relevance ?? baseNode?.relevance ?? 0.8,
      tags: input.tags ?? ['demo'],
      parent_scope: input.parent_scope ?? baseNode?.parent_scope ?? null,
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
    return NextResponse.json({ node })
    // -----------------------------

    /* ORIGINAL DB CODE:
    const node = await updateNode(id, user.id, input)
    return NextResponse.json({ node })
    */
  } catch (error) {
    return handleRouteError(error, `PATCH /api/context/[id]`)
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireSessionUser()
    const { id } = await params
    
    // --- DEMO MODE (TEMPORARY) ---
    return NextResponse.json({ success: true })
    // -----------------------------

    /* ORIGINAL DB CODE:
    await deleteNode(id, user.id)
    return NextResponse.json({ success: true })
    */
  } catch (error) {
    return handleRouteError(error, `DELETE /api/context/[id]`)
  }
}
