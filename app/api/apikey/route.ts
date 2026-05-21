import { NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'
import { requireSessionUser } from '@/lib/auth/server'
import { storeApiKey, revokeApiKey, getApiKeyInfo } from '@/lib/db'
import { handleRouteError } from '@/lib/api/errors'

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

export async function POST() {
  try {
    const user = await requireSessionUser()
    
    // Revoke any existing key first so there is only one active key at a time per user
    try {
      await revokeApiKey(user.id)
    } catch {
      // Ignore if no key exists
    }
    
    const rawKey = `ctx_${randomBytes(24).toString('base64url')}`
    const hash = createHash('sha256').update(rawKey).digest('hex')
    const prefix = rawKey.slice(0, 12)
    
    await storeApiKey(user.id, hash, prefix)
    
    return NextResponse.json({ key: rawKey, prefix }, { status: 201 })
  } catch (error) {
    return handleRouteError(error, 'POST /api/apikey')
  }
}

export async function DELETE() {
  try {
    const user = await requireSessionUser()
    await revokeApiKey(user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleRouteError(error, 'DELETE /api/apikey')
  }
}
