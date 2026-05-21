import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth-server'
import { postLoginPath } from '@/lib/auth-redirect'

// Artist-only flow. Casters and admins land on the wrong stepper and get
// a confusing 401-on-/artists/me error otherwise. (Audit C7.)
export default async function ArtistOnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'artist') {
    redirect(
      postLoginPath({
        role: session.user.role,
        approvalStatus: session.user.approvalStatus ?? null,
      }),
    )
  }
  return <>{children}</>
}
