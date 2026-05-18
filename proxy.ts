import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Check session for protected routes
  const session = await auth.api.getSession({
    headers: req.headers,
  })

  // Not authenticated — redirect to login
  if (!session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated user hitting /onboarding
  // If onboarding done, redirect to dashboard
  if (pathname === '/onboarding' && session.user.onboarding_done) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Authenticated user hitting dashboard or settings
  // If onboarding NOT done, redirect to onboarding
  if (
    (pathname.startsWith('/dashboard') || pathname.startsWith('/settings')) &&
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
  ],
}
