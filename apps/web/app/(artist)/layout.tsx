import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth-server'
import { postLoginPath } from '@/lib/auth-redirect'
import { DashboardShell, Forbidden403 } from '@/components/dashboard'

/**
 * Artist panel guard. Authoritative server-side RBAC (the edge middleware only
 * checks cookie presence):
 *   - no session            → /login
 *   - suspended | banned     → /suspended
 *   - role !== artist        → 403 (rendered in place, not a redirect loop)
 *   - approvalStatus !== ok  → /onboarding/artist
 * On success, wraps the panel in the artist DashboardShell.
 */
export default async function ArtistLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)

  if (!session?.user) redirect('/login')

  const { role, status, approvalStatus, email } = session.user

  if (status === 'suspended' || status === 'banned') redirect('/suspended')

  if (role !== 'artist') {
    return <Forbidden403 homeHref={postLoginPath({ role, approvalStatus: approvalStatus ?? null })} />
  }

  if (approvalStatus !== 'approved') redirect('/onboarding/artist')

  return (
    <DashboardShell
      role="artist"
      user={{ email, role }}
      notificationsHref="/artist/notifications"
    >
      {children}
    </DashboardShell>
  )
}
