import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth-server'

export default async function ArtistLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)

  if (!session?.user) redirect('/login')
  if (session.user.role !== 'artist') redirect('/login')
  if ((session.user as { approvalStatus?: string }).approvalStatus === 'pending') {
    redirect('/onboarding/pending')
  }
  if ((session.user as { approvalStatus?: string }).approvalStatus === 'rejected') {
    redirect('/onboarding/pending')
  }

  return <>{children}</>
}
