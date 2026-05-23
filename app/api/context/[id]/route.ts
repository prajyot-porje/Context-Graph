import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSessionUser } from '@/lib/auth/server'
import { updateNode, deleteNode } from '@/lib/db'
import { handleRouteError } from '@/lib/api/errors'

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
    const node = await updateNode(id, user.id, input)
    return NextResponse.json({ node })
  } catch (error) {
    return handleRouteError(error, `PATCH /api/context/[id]`)
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireSessionUser()
    const { id } = await params
    await deleteNode(id, user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleRouteError(error, `DELETE /api/context/[id]`)
  }
}
