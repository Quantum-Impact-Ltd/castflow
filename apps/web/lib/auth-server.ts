// Server-side session helper.
// The web app talks to the Better Auth instance hosted in apps/api over HTTP,
// so we cannot use the server-only `betterAuth()` factory here. Instead we
// proxy `auth.api.getSession({ headers })` to the API's `/api/auth/get-session`
// endpoint, forwarding the incoming request's cookies.

import { headers as nextHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { postLoginPath } from './auth-redirect'

type SessionUser = {
  id: string
  email: string
  role: 'artist' | 'caster' | 'admin'
  approvalStatus?: 'pending' | 'approved' | 'rejected'
  status?: 'pending' | 'active' | 'suspended' | 'banned'
  [key: string]: unknown
}

type SessionResult = {
  user: SessionUser
  session: { id: string; expiresAt: string }
} | null

// Server-side: hit the API's absolute origin (the Vercel proxy only applies to
// browser requests). With the proxy, the session cookie is first-party to this
// frontend, so the incoming request's `cookie` header carries it — we forward
// that to the API. Falls back to NEXT_PUBLIC_API_URL locally (API_ORIGIN unset).
const SERVER_API_ORIGIN =
  process.env['API_ORIGIN'] ?? process.env['NEXT_PUBLIC_API_URL'] ?? ''

async function getSession(opts: { headers: Headers }): Promise<SessionResult> {
  const cookie = opts.headers.get('cookie') ?? ''
  const res = await fetch(`${SERVER_API_ORIGIN}/api/auth/get-session`, {
    headers: { cookie },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = (await res.json()) as SessionResult
  return data
}

export const auth = {
  api: { getSession },
}

/**
 * Server-side guard for auth pages (/login, /register, /register/[role]).
 * If the visitor already has a valid session, send them straight to their
 * correct dashboard so they don't accidentally create a second account or
 * sit on a login form they don't need. Safe to call from any Server
 * Component / page module.
 */
export async function redirectIfAuthenticated(): Promise<void> {
  const session = await auth.api.getSession({ headers: await nextHeaders() }).catch(() => null)
  if (!session?.user) return
  const target = postLoginPath({
    role: session.user.role,
    approvalStatus: session.user.approvalStatus ?? null,
  })
  redirect(target)
}
