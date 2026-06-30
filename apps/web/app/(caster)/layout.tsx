import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth-server'
import { postLoginPath } from '@/lib/auth-redirect'
import { DashboardShell, Forbidden403 } from '@/components/dashboard'

/**
 * Caster panel guard. Authoritative server-side RBAC (edge middleware only
 * checks cookie presence):
 *   - no session         → /login
 *   - suspended | banned  → /suspended
 *   - role !== caster     → 403 (rendered in place)
 *   - onboarding gate     → /onboarding/caster (FAILS CLOSED)
 *
 * The onboarding gate fetches the caster profile and lets the caster through
 * only on a confirmed `onboardingCompletedAt`. Any fetch failure / 5xx sends
 * them to onboarding rather than past the gate (audit C3). The redirect() calls
 * stay OUTSIDE the try/catch because Next implements redirect by throwing.
 */
export default async function CasterLayout({ children }: { children: ReactNode }) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList }).catch(() => null)

  if (!session?.user) redirect('/login')

  const { role, status, approvalStatus, email } = session.user

  if (status === 'suspended' || status === 'banned') redirect('/suspended')

  if (role !== 'caster') {
    return <Forbidden403 homeHref={postLoginPath({ role, approvalStatus: approvalStatus ?? null })} />
  }

  // Absolute API origin for this server-side fetch — the Vercel proxy only
  // rewrites browser requests, and NEXT_PUBLIC_API_URL is empty in the proxied
  // setup (a relative URL would throw here and fail the gate closed). Falls
  // back to NEXT_PUBLIC_API_URL locally where API_ORIGIN is unset.
  const apiOrigin =
    process.env['API_ORIGIN'] ?? process.env['NEXT_PUBLIC_API_URL'] ?? ''

  let onboarded = false
  try {
    const res = await fetch(`${apiOrigin}/api/v1/casters/me`, {
      headers: { cookie: headersList.get('cookie') ?? '' },
      cache: 'no-store',
    })
    if (res.ok) {
      const json = (await res.json()) as { data?: { onboardingCompletedAt?: string | null } }
      onboarded = Boolean(json?.data?.onboardingCompletedAt)
    }
  } catch {
    onboarded = false
  }
  if (!onboarded) redirect('/onboarding/caster')

  return (
    <DashboardShell role="caster" user={{ email, role }} notificationsHref="/caster/notifications">
      {children}
    </DashboardShell>
  )
}
