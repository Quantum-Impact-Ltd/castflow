import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth-server'

// Onboarding pages should never be indexed — they're per-user flows behind
// auth. (Audit L14.)
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)
  if (!session?.user) redirect('/login')

  // Admins don't onboard — bounce them to /admin. (Audit C7.)
  if (session.user.role === 'admin') redirect('/admin')

  // Suspended / banned users can't proceed regardless of role. Mirrors
  // the panel layouts in (artist)/(caster)/(admin). (Audit M21.)
  const status = (session.user as { status?: string }).status
  if (status === 'suspended' || status === 'banned') redirect('/suspended')

  // Role-vs-flow check (artist sub-routes only allow artists, etc.) lives
  // in the per-flow layouts: app/onboarding/{artist,caster,pending}/layout.tsx.
  return <>{children}</>
}
