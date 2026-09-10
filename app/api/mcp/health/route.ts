import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase'
import { validateApiKey } from '@/lib/db'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS })
}

export async function GET(request: NextRequest) {
  try {
    // 1. Extract API key from header or query param
    let rawApiKey: string | null = null

    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      rawApiKey = authHeader
    } else {
      const headerKey = request.headers.get('x-api-key')
      if (headerKey) {
        rawApiKey = headerKey
      } else {
        const { searchParams } = new URL(request.url)
        rawApiKey = searchParams.get('key') || searchParams.get('apiKey') || searchParams.get('api_key')
      }
    }

    if (!rawApiKey) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 401, headers: CORS }
      )
    }

    // 2. Validate API key via centralized helper (strips Bearer, quotes, verifies SHA-256)
    const userId = await validateApiKey(rawApiKey)
    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401, headers: CORS }
      )
    }

    // 3. Supabase lookup
    const supabase = createSupabaseServer()

    // Fetch user name from 'user' table
    const { data: userData, error: userError } = await supabase
      .from('user')
      .select('name')
      .eq('id', userId)
      .maybeSingle()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: CORS }
      )
    }

    // Count context nodes
    const { count, error: countError } = await supabase
      .from('context_nodes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
      return NextResponse.json(
        { error: 'Failed to retrieve node count' },
        { status: 500, headers: CORS }
      )
    }

    return NextResponse.json(
      {
        status: 'ok',
        user: userData.name,
        nodeCount: count || 0,
        timestamp: new Date().toISOString(),
      },
      { headers: CORS }
    )
  } catch (error) {
    console.error('Health check endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: CORS }
    )
  }
}
