import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth-server'
import { DashboardShell } from '@/components/dashboard'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)

  if (!session?.user) redirect('/login')
  if (session.user.role !== 'admin') redirect('/login')

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
