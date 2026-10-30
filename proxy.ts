import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { authDestination } from '@/lib/navigation'

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Define route scopes
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/settings') || 
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/connect') || pathname === '/entry'

  const isAuthRoute = 
    pathname === '/login' || 
    pathname === '/signup'

  // Retrieve the user session from Better Auth
  let session = null
  try {
    session = await auth.api.getSession({
      headers: req.headers,
    })
  } catch (err) {
    console.error('[proxy.ts] Session lookup failed:', err instanceof Error ? err.name : 'Unknown error')
  }

  // 1. Unauthenticated user trying to access a protected route -> redirect to login
  if (!session && isProtectedRoute) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 2. Authenticated user trying to access login/signup -> redirect to dashboard
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL(authDestination(req.nextUrl.searchParams.get('from')), req.url))
  }

  // Readiness is derived from saved context in /entry and the dashboard server page.
  // The legacy onboarding_done flag is never an authorization or readiness gate.

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/onboarding',
    '/connect',
    '/login',
    '/signup',
    '/entry',
  ],
}
