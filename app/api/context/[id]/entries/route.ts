import { NextRequest, NextResponse } from 'next/server'
import { requireSessionUser } from '@/lib/auth/server'
import { getNodeWithEntries } from '@/lib/db'
import { handleRouteError } from '@/lib/api/errors'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireSessionUser()
    const { id } = await params
    const data = await getNodeWithEntries(id, user.id)
    return NextResponse.json(data)
  } catch (error) {
    return handleRouteError(error, `GET /api/context/[id]/entries`)
  }
}
