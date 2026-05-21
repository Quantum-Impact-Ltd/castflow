import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth-server'
import { postLoginPath } from '@/lib/auth-redirect'
import { DashboardShell } from '@/components/dashboard'

export default async function CasterLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers()
  const session = await auth.api.getSession({ headers: hdrs }).catch(() => null)

  if (!session?.user) redirect('/login')

  if (session.user.role !== 'caster') {
    redirect(
      postLoginPath({
        role: session.user.role,
        approvalStatus: session.user.approvalStatus ?? null,
      })
    )
  }

  const status = (session.user as { status?: string }).status
  if (status === 'suspended' || status === 'banned') redirect('/suspended')

  // Gate: redirect to onboarding until StepCasterWelcome marks it complete.
  // `onboardingCompletedAt` lives on the profile row, not in the session, so
  // we fetch it directly. We FAIL CLOSED — if we can't confirm the gate
  // (network error or non-OK), send the caster to onboarding rather than
  // letting an un-onboarded account into the dashboard. The earlier
  // implementation swallowed the error and fell through, which meant a
  // momentary 5xx permanently bypassed the gate (audit finding C3).
  // NB: keep this OUTSIDE the try/catch — redirect() throws a Next.js
  // navigation signal that must propagate.
  let onboardingComplete = false
  let gateConfirmed = false
  try {
    const res = await fetch(`${process.env['NEXT_PUBLIC_API_URL']}/api/v1/casters/me`, {
      headers: { cookie: hdrs.get('cookie') ?? '' },
      cache: 'no-store',
    })
    if (res.ok) {
      const body = (await res.json()) as { data?: { onboardingCompletedAt?: string | null } }
      onboardingComplete = Boolean(body.data?.onboardingCompletedAt)
      gateConfirmed = true
    }
  } catch (err) {
    console.error('[caster-layout] onboarding gate fetch failed', err)
  }
  if (!gateConfirmed || !onboardingComplete) redirect('/onboarding/caster')

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
