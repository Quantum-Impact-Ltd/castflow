import { NextResponse, type NextRequest } from 'next/server'

// First-line, edge-cheap auth gate for every dashboard panel. This only checks
// for the presence of a Better Auth session cookie and bounces fully
// unauthenticated traffic to /login. It deliberately does NOT attempt role
// checks — the authoritative session + role enforcement (and the 403 for a
// wrong-role user) lives in each route-group's server-component layout, which
// can validate the session against the API. Defence in depth, not a single
// trusted edge check.

export function middleware(request: NextRequest) {
  const hasSession = request.cookies.getAll().some((c) => c.name.includes('session_token'))

  if (!hasSession) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/artist/:path*', '/caster/:path*', '/admin/:path*'],
}
