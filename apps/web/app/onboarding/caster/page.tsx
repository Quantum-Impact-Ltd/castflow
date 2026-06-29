'use client'

import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { useMyCaster } from '@/lib/hooks/use-caster'
import { Skeleton } from '@/components/ui/skeleton'
import { AtmosphereBackdrop } from '@/components/shared/atmosphere-backdrop'
import { StepCasterWelcome } from '@/components/onboarding/steps/step-caster-welcome'

/**
 * Caster onboarding is a single welcome screen — there's nothing the caster
 * must fill in to start (posting a job and booking each have their own flow,
 * and optional company details live in settings). StepCasterWelcome marks
 * onboarding complete on mount. (Audit #7.)
 */
export default function CasterOnboardingPage() {
  const { data: profile, isLoading, isError } = useMyCaster()

  if (isLoading) {
    return (
      <div className="dark min-h-screen bg-[var(--ink-900)] text-white">
        <div className="mx-auto max-w-2xl space-y-6 p-8">
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

  return (
    <div className="dark relative isolate min-h-screen w-full overflow-hidden bg-[var(--ink-900)] text-white">
      <AtmosphereBackdrop />

      <header className="relative z-10 border-b border-white/8">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4 lg:px-6">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm font-medium tracking-tight text-white transition-opacity hover:opacity-90"
          >
            <span
              className="inline-block h-2 w-2 rounded-full bg-[var(--cta-400)] transition-transform duration-500 group-hover:scale-150"
              aria-hidden
            />
            CastFlow
          </Link>
          <Link
            href="/caster/dashboard"
            className="inline-flex items-center gap-1 text-xs text-white/55 transition-colors hover:text-white"
          >
            <ChevronLeft className="h-3 w-3" aria-hidden />
            Skip to dashboard
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-2xl px-4 py-12 lg:px-6 lg:py-16">
        <div className="mb-8">
          <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-white/70 uppercase">
            Welcome to CastFlow
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            You&apos;re all set, {profile.companyName}.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/65 sm:text-base">
            Pick where to start — you can do either any time.
          </p>
        </div>

        <StepCasterWelcome />
      </main>
    </div>
  )
}
