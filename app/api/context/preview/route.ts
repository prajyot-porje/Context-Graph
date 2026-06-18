import { NextRequest, NextResponse } from 'next/server'
import { requireSessionUser } from '@/lib/auth/server'
import { getUserNodes } from '@/lib/db'
import { assembleContext } from '@/lib/context'
import { handleRouteError } from '@/lib/api/errors'

export async function GET(req: NextRequest) {
  try {
    const user = await requireSessionUser()
    const { searchParams } = new URL(req.url)
    const scope = searchParams.get('scope') || 'me'

    const nodes = await getUserNodes(user.id)
    const assembled = assembleContext(nodes, scope)

    // Count nodes that were actually included
    let nodeCount = 0
    const meNode = nodes.find(n => n.scope === 'me')
    if (meNode) nodeCount++

    if (scope !== 'me') {
      if (scope.startsWith('agency')) {
        const agencyNode = nodes.find(n => n.scope === 'agency')
        if (agencyNode) nodeCount++
      }
      if (scope.includes('/')) {
        const projectNode = nodes.find(n => n.scope === scope)
        if (projectNode) nodeCount++
      }
    }

    return NextResponse.json({
      assembled,
      tokenEstimate: Math.round(assembled.length / 4),
      nodeCount,
    })
  } catch (error) {
    return handleRouteError(error, 'GET /api/context/preview')
  }
}
