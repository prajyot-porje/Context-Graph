import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Define route scopes
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/settings') || 
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/connect')

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
    console.error('[proxy.ts] Failed to fetch session:', err)
  }

  // 1. Unauthenticated user trying to access a protected route -> redirect to login
  if (!session && isProtectedRoute) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 2. Authenticated user trying to access login/signup -> redirect to dashboard
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // ROADMAP.md P1.6: the wizard is now an optional, always-revisitable path (reachable
  // directly, linked from /connect) rather than a forced one-time gate. A fresh signup
  // goes straight to /connect, and `onboarding_done` gets set on first successful MCP
  // call instead of only via the wizard — so it no longer means "wizard completed" and
  // can't be used to gate access to /onboarding or to force a redirect into it. An empty
  // graph on /dashboard, /settings, or /connect is a valid, expected state now.

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
  ],
}
