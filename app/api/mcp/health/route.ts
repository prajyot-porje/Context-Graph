import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createSupabaseServer } from '@/lib/supabase'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS })
}

export async function GET(request: NextRequest) {
  try {
    // 1. Extract API key from header or query param
    let apiKey = request.headers.get('x-api-key')
    if (!apiKey) {
      const { searchParams } = new URL(request.url)
      apiKey = searchParams.get('key')
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 401, headers: CORS }
      )
    }

    // 2. Hash key with SHA-256
    const hash = createHash('sha256').update(apiKey).digest('hex')

    // 3. Supabase lookup
    const supabase = createSupabaseServer()
    
    // Look up in api_keys
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key_hash', hash)
      .maybeSingle()

    if (keyError || !keyData) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401, headers: CORS }
      )
    }

    const userId = keyData.user_id

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

    // Update last_used
    await supabase
      .from('api_keys')
      .update({ last_used: new Date().toISOString() })
      .eq('key_hash', hash)

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
