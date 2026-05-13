import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth-server'
import { DashboardShell } from '@/components/dashboard'

export default async function CasterLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)

  if (!session?.user) redirect('/login')
  if (session.user.role !== 'caster') redirect('/login')

  return (
    <DashboardShell
      role="caster"
      brand="CastFlow"
      brandHref="/caster/dashboard"
      user={{ email: session.user.email, role: session.user.role }}
    >
      {children}
    </DashboardShell>
  )
}
