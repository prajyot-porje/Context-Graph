import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { DataError } from '@/lib/db'

export function handleRouteError(error: unknown, label: string) {
  console.error(`[${label}] Request failed`, error instanceof Error ? error.name : 'Unknown error')
  if (error instanceof DataError) return NextResponse.json({ error: error.message }, { status: error.status })
  
  if (error instanceof Error && error.message === 'Unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Validation error', details: error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
