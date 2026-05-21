import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth-server'
import { postLoginPath } from '@/lib/auth-redirect'
import { DashboardShell } from '@/components/dashboard'

export default async function ArtistLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)

  if (!session?.user) redirect('/login')

  // Wrong-role users land on THEIR correct destination (not /login). Avoids
  // a confusing "log in again" loop when someone navigates to the wrong panel.
  if (session.user.role !== 'artist') {
    redirect(
      postLoginPath({
        role: session.user.role,
        approvalStatus: session.user.approvalStatus ?? null,
      })
    )
  }

  // Status guard: suspended/banned users shouldn't reach a dashboard. The
  // API also rejects their session requests, but redirecting early gives a
  // cleaner UX than a flood of 401s.
  const status = (session.user as { status?: string }).status
  if (status === 'suspended' || status === 'banned') redirect('/suspended')

  const approvalStatus = (session.user as { approvalStatus?: string }).approvalStatus
  if (approvalStatus !== 'approved') {
    redirect('/onboarding/artist')
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
