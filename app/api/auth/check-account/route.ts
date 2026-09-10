import { NextRequest, NextResponse } from 'next/server'
import { getAccountStatus } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
    }

    const status = await getAccountStatus(email)
    return NextResponse.json({ status })
  } catch (err: unknown) {
    console.error('Error in /api/auth/check-account:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
