'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Briefcase, Loader2, Users } from 'lucide-react'
import { useCompleteOnboarding } from '@/lib/hooks/use-caster'

const ACTIONS = [
  {
    href: '/caster/jobs/new',
    icon: Briefcase,
    title: 'Post a job',
    blurb:
      "Start your first casting call. Six quick steps and you're live in front of approved artists.",
  },
  {
    href: '/caster/talent',
    icon: Users,
    title: 'Browse talent',
    blurb:
      "Search the directory of verified UK models and actors. Shortlist and invite directly.",
  },
] as const

export function StepCasterWelcome() {
  const complete = useCompleteOnboarding()
  const firedRef = useRef(false)

  // Mark onboarding as complete on first render. The mutation is idempotent.
  // Using a ref guard instead of an empty dep array avoids the missing-dep lint rule.
  useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true
    complete.mutate()
  })

  // Wait for the mutation to commit before revealing the action cards.
  // Without this, a caster clicking 'Post a job' before the PATCH lands
  // would be bounced back here by the (caster)/layout gate (which checks
  // onboardingCompletedAt on every navigation) and lose context. (H17.)
  if (!complete.isSuccess) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.03] p-5 backdrop-blur-xl">
          <Loader2 className="h-5 w-5 animate-spin text-[#f9a26c]" />
          <div className="text-sm">
            <p className="font-medium text-white">Finishing setup…</p>
            <p className="text-xs leading-relaxed text-white/60">
              {complete.isError
                ? 'Something went wrong — retrying.'
                : 'Just a second — wiring up your account.'}
            </p>
          </div>
        </div>
        {/* Skeleton placeholder for the cards so the layout doesn't jump. */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="h-40 animate-pulse rounded-2xl bg-white/[0.03]" />
          <div className="h-40 animate-pulse rounded-2xl bg-white/[0.03]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {ACTIONS.map((a) => {
          const Icon = a.icon
          return (
            <Link
              key={a.href}
              href={a.href}
              className="group flex flex-col gap-3 rounded-2xl border border-white/12 bg-white/[0.03] p-5 backdrop-blur-xl transition hover:border-white/25 hover:bg-white/[0.05]"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#f9a26c] text-[var(--ink-900)]">
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold tracking-tight text-white">
                  {a.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/60">{a.blurb}</p>
              </div>
              <span className="mt-auto inline-flex items-center font-mono text-[10px] font-medium tracking-[0.18em] text-[#f9a26c] uppercase">
                Go
                <ArrowRight className="ml-1 h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          )
        })}
      </div>

      <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-5 backdrop-blur-xl">
        <h3 className="text-sm font-semibold tracking-tight text-white">How payment works</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/65">
          You pay per booking, not upfront. When you accept an artist&apos;s bid, the
          agreed amount is held in escrow via Stripe and released after the shoot. You can
          add your card details at the booking step — no setup needed now.
        </p>
      </div>

      <div className="flex justify-end">
        <Link
          href="/caster/dashboard"
          className="inline-flex items-center text-sm text-white/55 transition hover:text-white"
        >
          Or go to your dashboard
          <ArrowRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
