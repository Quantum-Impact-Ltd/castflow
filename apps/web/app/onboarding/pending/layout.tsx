import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth-server'
import { postLoginPath } from '@/lib/auth-redirect'

// /onboarding/pending is the post-submission landing for artists awaiting
// approval. Casters don't have an approval gate. (Audit C7.)
export default async function PendingOnboardingLayout({
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
