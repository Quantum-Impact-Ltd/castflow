import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth-server'
import { DashboardShell } from '@/components/dashboard'

export default async function ArtistLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)

  if (!session?.user) redirect('/login')
  if (session.user.role !== 'artist') redirect('/login')
  const approvalStatus = (session.user as { approvalStatus?: string }).approvalStatus
  if (approvalStatus !== 'approved') {
    redirect('/onboarding/pending')
  }

  return (
    <DashboardShell
      role="artist"
      brand="CastFlow"
      brandHref="/artist/dashboard"
      user={{ email: session.user.email, role: session.user.role }}
      notificationsHref="/artist/notifications"
    >
      {children}
    </DashboardShell>
  )
}
