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
  const session = await auth.api.getSession({
    headers: req.headers,
  })

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

  // 3. Authenticated user accessing /onboarding but already completed it -> redirect to dashboard
  if (session && pathname === '/onboarding' && session.user.onboarding_done) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // 4. Authenticated user accessing dashboard/settings/connect but onboarding not completed -> redirect to onboarding
  if (
    session &&
    (pathname.startsWith('/dashboard') || pathname.startsWith('/settings') || pathname.startsWith('/connect')) &&
    !session.user.onboarding_done
  ) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

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
