import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSessionUser } from '@/lib/auth/server'
import { getUserNodes, createNode } from '@/lib/db'
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
    return NextResponse.json({ nodes })
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
    return NextResponse.json({ node }, { status: 201 })
  } catch (error) {
    return handleRouteError(error, 'POST /api/context')
  }
}
