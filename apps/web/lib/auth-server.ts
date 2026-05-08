// Server-side session helper.
// The web app talks to the Better Auth instance hosted in apps/api over HTTP,
// so we cannot use the server-only `betterAuth()` factory here. Instead we
// proxy `auth.api.getSession({ headers })` to the API's `/api/auth/get-session`
// endpoint, forwarding the incoming request's cookies.

type SessionUser = {
  id: string
  email: string
  role: 'artist' | 'caster' | 'admin' | string
  approvalStatus?: 'pending' | 'approved' | 'rejected' | string
  [key: string]: unknown
}

type SessionResult = {
  user: SessionUser
  session: { id: string; expiresAt: string }
} | null

async function getSession(opts: { headers: Headers }): Promise<SessionResult> {
  const cookie = opts.headers.get('cookie') ?? ''
  const res = await fetch(`${process.env['NEXT_PUBLIC_API_URL']}/api/auth/get-session`, {
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
