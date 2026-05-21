import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export function handleRouteError(error: unknown, label: string) {
  console.error(`[${label}]`, error)
  
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
