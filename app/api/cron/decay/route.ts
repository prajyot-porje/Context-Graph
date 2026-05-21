import { NextRequest, NextResponse } from 'next/server'
import { decayRelevanceScores } from '@/lib/db'
import { handleRouteError } from '@/lib/api/errors'

async function handleDecay(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await decayRelevanceScores()
  return NextResponse.json({ success: true })
}

export async function GET(req: NextRequest) {
  try {
    return await handleDecay(req)
  } catch (error) {
    return handleRouteError(error, 'GET /api/cron/decay')
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handleDecay(req)
  } catch (error) {
    return handleRouteError(error, 'POST /api/cron/decay')
  }
}
