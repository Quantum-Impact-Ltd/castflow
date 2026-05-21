import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth-server'
import { postLoginPath } from '@/lib/auth-redirect'
import { DashboardShell } from '@/components/dashboard'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)

  if (!session?.user) redirect('/login')

  if (session.user.role !== 'admin') {
    redirect(
      postLoginPath({
        role: session.user.role,
        approvalStatus: session.user.approvalStatus ?? null,
      })
    )
  }

  const status = (session.user as { status?: string }).status
  if (status === 'suspended' || status === 'banned') redirect('/suspended')

  return (
    <DashboardShell
      role="admin"
      brand="CastFlow Admin"
      brandHref="/admin"
      user={{ email: session.user.email, role: session.user.role }}
    >
      {children}
    </DashboardShell>
  )
}
