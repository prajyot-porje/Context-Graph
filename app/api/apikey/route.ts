import { NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'
import { requireSessionUser } from '@/lib/auth/server'
import { storeApiKey, revokeApiKey, getApiKeyInfo } from '@/lib/db'
import { handleRouteError } from '@/lib/api/errors'
import { requireMutationUser } from '@/lib/api/session'

export async function GET() {
  try {
    const user = await requireSessionUser()
    const keyInfo = await getApiKeyInfo(user.id)
    
    if (!keyInfo) {
      return NextResponse.json({ prefix: null, last_used: null })
    }
    
    return NextResponse.json(keyInfo)
  } catch (error) {
    return handleRouteError(error, 'GET /api/apikey')
  }
}

export async function POST(request:Request) {
  try {
    const user = await requireMutationUser(request)
    
    const rawKey = `ctx_${randomBytes(24).toString('base64url')}`
    const hash = createHash('sha256').update(rawKey).digest('hex')
    const prefix = rawKey.slice(0, 12)
    
    await storeApiKey(user.id, hash, prefix)
    
    return NextResponse.json({ key: rawKey, prefix }, { status: 201 })
  } catch (error) {
    return handleRouteError(error, 'POST /api/apikey')
  }
}

export async function DELETE(request:Request) {
  try {
    const user = await requireMutationUser(request)
    await revokeApiKey(user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleRouteError(error, 'DELETE /api/apikey')
  }
}
