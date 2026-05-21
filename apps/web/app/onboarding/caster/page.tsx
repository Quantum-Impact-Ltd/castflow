'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { OnboardingShell } from '@/components/onboarding/onboarding-shell'
import { StepCasterCompany } from '@/components/onboarding/steps/step-caster-company'
import { StepCasterWelcome } from '@/components/onboarding/steps/step-caster-welcome'
import { useMyCaster } from '@/lib/hooks/use-caster'
import { Skeleton } from '@/components/ui/skeleton'

const STEPS = [
  { key: 'company', label: 'Company' },
  { key: 'welcome', label: 'Welcome' },
] as const

interface StepCopy {
  title: string
  subtitle: string
  tips: { heading: string; bullets: ReadonlyArray<string> }
}

const STEP_COPY: Record<(typeof STEPS)[number]['key'], StepCopy> = {
  company: {
    title: 'A few extras about your company',
    subtitle: 'Optional. You can do this later from settings.',
    tips: {
      heading: 'Why bother?',
      bullets: [
        'Phone shows up on the booking detail once a contract is signed — artists message you in-platform until then.',
        'A website link adds credibility, especially for invite-only jobs to busier artists.',
        'Both are skippable — you can edit them any time from your account settings.',
      ],
    },
  },
  welcome: {
    title: 'You’re all set',
    subtitle: 'Pick where to start. You can come back to either any time.',
    tips: {
      heading: 'How CastFlow works',
      bullets: [
        'Post a job — artists bid, you shortlist, accept the best fit.',
        'Browse talent — search the verified directory, invite specific artists.',
        'Pay per booking — escrow via Stripe, released after the shoot.',
        'No subscription required at launch.',
      ],
    },
  },
}

function StepTips({ stepKey }: { stepKey: (typeof STEPS)[number]['key'] }) {
  const copy = STEP_COPY[stepKey].tips
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold tracking-tight">{copy.heading}</h3>
      <ul className="text-muted-foreground space-y-2 text-sm leading-relaxed">
        {copy.bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-foreground/40 mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-current" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function clamp(n: number, max: number) {
  if (Number.isNaN(n)) return 0
  return Math.max(0, Math.min(n, max))
}

export default function CasterOnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: profile, isLoading, isError } = useMyCaster()

  const [currentIndex, setCurrentIndex] = useState(() =>
    clamp(Number(searchParams.get('step') ?? '0'), STEPS.length - 1)
  )

  // Once the profile loads, if onboarding is already complete fast-forward
  // to the welcome step (step 1) so returning casters don't re-see the form.
  const profileLoadedRef = useRef(false)
  useEffect(() => {
    if (!profile || profileLoadedRef.current) return
    profileLoadedRef.current = true
    if (profile.onboardingCompletedAt && searchParams.get('step') === null) {
      setCurrentIndex(1)
    }
  }, [profile, searchParams])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (currentIndex === 0) params.delete('step')
    else params.set('step', String(currentIndex))
    const qs = params.toString()
    router.replace(qs ? `?${qs}` : '?', { scroll: false })
  }, [currentIndex, router])

  if (isLoading) {
    return (
      <div className="dark min-h-screen bg-[var(--ink-900)] text-white">
        <div className="mx-auto max-w-5xl space-y-6 p-8">
          <Skeleton className="h-10 w-full bg-white/[0.04]" />
          <Skeleton className="h-64 w-full bg-white/[0.04]" />
        </div>
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="grid min-h-screen place-items-center bg-[var(--ink-900)] text-white">
        <p className="text-sm text-white/55">
          Couldn&apos;t load your profile. Please refresh and try again.
        </p>
      </div>
    )
  }

  const currentStep = STEPS[currentIndex]
  if (!currentStep) return null
  const copy = STEP_COPY[currentStep.key]
  const goNext = () => setCurrentIndex((i) => Math.min(STEPS.length - 1, i + 1))

  // Welcome step is only reachable after saving or skipping Company details.
  // Derive from the current index so the stepper reflects what's accessible.
  const maxUnlockedIndex = Math.max(currentIndex, profile?.onboardingCompletedAt ? 1 : 0)

  return (
    <OnboardingShell
      steps={STEPS}
      currentIndex={currentIndex}
      onStepClick={setCurrentIndex}
      maxUnlockedIndex={maxUnlockedIndex}
      title={copy.title}
      subtitle={copy.subtitle}
      tips={<StepTips stepKey={currentStep.key} />}
    >
      {currentStep.key === 'company' && (
        <StepCasterCompany profile={profile} onSkip={goNext} onNext={goNext} />
      )}
      {currentStep.key === 'welcome' && <StepCasterWelcome />}
    </OnboardingShell>
  )
}
