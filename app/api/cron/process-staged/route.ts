import { NextRequest, NextResponse } from 'next/server'
import { processStagedBatch } from '@/lib/process-staged'
import { handleRouteError } from '@/lib/api/errors'

export const maxDuration = 60

// Safety net only — see lib/process-staged.ts for why. Primary draining
// happens via Next.js `after()` in app/api/mcp/route.ts, triggered by real
// `remember`/`get_context` traffic. This cron only catches entries staged by
// a user who never made another MCP call. Runs once/day: Vercel Hobby plan
// rejects any cron schedule more frequent than daily at deploy time.
async function handleProcessStaged(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await processStagedBatch()
  return NextResponse.json({ success: true, ...result })
}

export async function GET(req: NextRequest) {
  try {
    return await handleProcessStaged(req)
  } catch (error) {
    return handleRouteError(error, 'GET /api/cron/process-staged')
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handleProcessStaged(req)
  } catch (error) {
    return handleRouteError(error, 'POST /api/cron/process-staged')
  }
}
