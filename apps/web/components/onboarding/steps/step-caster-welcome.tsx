'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Building2,
  Loader2,
  Users,
} from 'lucide-react'
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
    blurb: 'Search the directory of verified UK models and actors. Shortlist and invite directly.',
  },
] as const

export function StepCasterWelcome() {
  const complete = useCompleteOnboarding()
  const firedRef = useRef(false)

  // Mark onboarding as complete once on mount. The mutation is idempotent; the
  // ref guards against React StrictMode's double-invoke in development.
  useEffect(() => {
    if (firedRef.current) return
    firedRef.current = true
    complete.mutate()
    // Intentionally fire once on mount — `complete` is a stable mutation object.
  }, [])

  // Wait for the mutation to commit before revealing the action cards.
  // Without this, a caster clicking 'Post a job' before the PATCH lands
  // would be bounced back here by the (caster)/layout gate (which checks
  // onboardingCompletedAt on every navigation) and lose context. (H17.)
  //
  // The mutation auto-retries (see useCompleteOnboarding). If it still fails
  // after retries, surface a real error + manual Retry rather than spinning
  // forever — otherwise a transient API blip traps the caster on this screen.
  if (!complete.isSuccess) {
    const failed = complete.isError
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.03] p-5">
          {failed ? (
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          ) : (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[var(--cta-400)]" />
          )}
          <div className="flex-1 text-sm">
            <p className="font-medium text-white">
              {failed ? 'Couldn’t finish setup' : 'Finishing setup…'}
            </p>
            <p className="text-xs leading-relaxed text-white/60">
              {failed
                ? 'We couldn’t save the last step. Check your connection and try again.'
                : 'Just a second — wiring up your account.'}
            </p>
          </div>
          {failed && (
            <button
              type="button"
              onClick={() => complete.mutate()}
              className="shrink-0 rounded-lg bg-[var(--cta-400)] px-3 py-1.5 text-xs font-medium text-[var(--ink-900)] transition hover:opacity-90"
            >
              Retry
            </button>
          )}
        </div>
        {/* Skeleton placeholder for the cards so the layout doesn't jump. */}
        {!failed && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-40 animate-pulse rounded-2xl bg-white/[0.03]" />
            <div className="h-40 animate-pulse rounded-2xl bg-white/[0.03]" />
          </div>
        )}
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
              className="group flex flex-col gap-3 rounded-2xl border border-white/12 bg-white/[0.03] p-5 transition hover:border-white/25 hover:bg-white/[0.05]"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--cta-400)] text-[var(--ink-900)]">
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold tracking-tight text-white">{a.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{a.blurb}</p>
              </div>
              <span className="mt-auto inline-flex items-center font-mono text-[10px] font-medium tracking-[0.18em] text-[var(--cta-400)] uppercase">
                Go
                <ArrowRight className="ml-1 h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          )
        })}
      </div>

      {/* Optional company details (logo, phone, website) live in settings —
          surfaced here as a soft prompt rather than a forced onboarding step. */}
      <Link
        href="/caster/settings"
        className="group flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.03] p-4 transition hover:border-white/25 hover:bg-white/[0.05]"
      >
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/12 bg-white/[0.04] text-white/75">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">Add your logo, phone & website</p>
          <p className="text-xs leading-relaxed text-white/60">
            Optional — artists are more likely to bid on jobs from brands they recognise.
          </p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white/70" />
      </Link>

      <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-5">
        <h3 className="text-sm font-semibold tracking-tight text-white">How payment works</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/65">
          CastFlow runs on a simple caster subscription — that&apos;s the only charge from us. Job
          fees are paid directly to the artist, off-platform, on whatever terms suit you both.
          CastFlow never holds or takes a cut of those fees. Artists join free.
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
