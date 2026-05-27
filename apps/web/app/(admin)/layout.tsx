import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth-server'
import { postLoginPath } from '@/lib/auth-redirect'
import { DashboardShell, Forbidden403 } from '@/components/dashboard'

/**
 * Admin panel guard. Authoritative server-side RBAC (edge middleware only
 * checks cookie presence):
 *   - no session      → /login
 *   - role !== admin  → 403 (rendered in place — never reachable by artists/casters)
 *   - suspended|banned → /suspended
 * Admin data + routes are unreachable by other roles at every layer (here, plus
 * `requireRole('admin')` on every /admin API endpoint).
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)

  if (!session?.user) redirect('/login')

  const { role, status, approvalStatus, email } = session.user

  if (role !== 'admin') {
    return <Forbidden403 homeHref={postLoginPath({ role, approvalStatus: approvalStatus ?? null })} />
  }

  if (status === 'suspended' || status === 'banned') redirect('/suspended')

  return (
    <DashboardShell
      role="admin"
      user={{ email, role }}
      brand="CastFlow Admin"
      brandHref="/admin"
    >
      {children}
    </DashboardShell>
  )
}
