'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react'
import { useMyArtistProfile } from '@/lib/hooks/use-artist'

const REFETCH_COOLDOWN_SECONDS = 30

export default function OnboardingPendingPage() {
  const router = useRouter()
  const { data: profile, isLoading, refetch, isFetching } = useMyArtistProfile()

  // Per-page cooldown gate on the "Check status" button so the user can't
  // spam refetch and hammer the API. Tracks an epoch timestamp instead of a
  // boolean so we can render the remaining seconds. (Audit M22.)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (cooldownUntil <= now) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [cooldownUntil, now])

  const remaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000))
  const onCooldown = remaining > 0

  const handleRefetch = () => {
    if (onCooldown || isFetching) return
    setCooldownUntil(Date.now() + REFETCH_COOLDOWN_SECONDS * 1000)
    void refetch()
  }

  // Auto-redirect if approved
  useEffect(() => {
    if (profile?.approvalStatus === 'approved') {
      router.replace('/artist/dashboard')
    }
  }, [profile?.approvalStatus, router])

  // Rejected: do NOT silently bounce to the stepper. Render an inline
  // rejected state with the admin's notes + an explicit CTA to edit and
  // resubmit. The previous silent redirect meant artists had no idea why
  // they were rejected and resubmitted unchanged. (Audit H15.)

  return (
    <div className="relative isolate grid min-h-screen w-full place-items-center overflow-hidden bg-[var(--ink-900)] px-4 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-[#2a6b96] opacity-[0.22] blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-[-12rem] h-[32rem] w-[32rem] rounded-full bg-[#f9a26c] opacity-[0.16] blur-[140px]"
      />

      <div className="relative z-10 mx-auto max-w-md text-center">
        {isLoading ? (
          <div className="space-y-4">
            <div className="mx-auto h-14 w-14 animate-pulse rounded-full bg-white/10" />
            <div className="mx-auto h-4 w-48 animate-pulse rounded bg-white/10" />
          </div>
        ) : profile?.approvalStatus === 'rejected' ? (
          <>
            <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full border border-rose-400/30 bg-rose-400/[0.08] backdrop-blur-xl">
              <AlertTriangle className="h-6 w-6 text-rose-300" />
            </div>
            <p className="font-mono text-[10px] tracking-[0.22em] text-white/45 uppercase">
              Changes requested
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Your profile needs a few tweaks
            </h1>
            {profile.approvalNotes ? (
              <div className="mt-5 rounded-2xl border border-rose-400/25 bg-rose-400/[0.06] p-4 text-left">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-rose-200/85">
                  Admin notes
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/85">
                  {profile.approvalNotes}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-white/65">
                The admin didn&apos;t leave specific notes. Review your profile,
                tighten anything that feels weak, then resubmit.
              </p>
            )}
            <div className="mt-8 flex flex-col items-center gap-3">
              <Link
                href="/onboarding/artist"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#f9a26c] px-5 py-2.5 text-sm font-semibold text-[var(--ink-900)] transition hover:bg-[#fab17f]"
              >
                Edit profile & resubmit
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        ) : profile?.approvalStatus === 'approved' ? (
          <>
            <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full border border-emerald-400/30 bg-emerald-400/[0.08] backdrop-blur-xl">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="font-mono text-[10px] tracking-[0.22em] text-white/45 uppercase">
              Application approved
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              You&apos;re in!
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/65">
              Your profile is live. Start browsing jobs and submitting bids.
            </p>
            <div className="mt-8">
              <Link
                href="/artist/dashboard"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#f9a26c] px-5 py-2.5 text-sm font-semibold text-[var(--ink-900)] transition hover:bg-[#fab17f]"
              >
                Go to dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full border border-white/12 bg-white/[0.04] backdrop-blur-xl">
              <Clock className="h-6 w-6 text-[#f9a26c]" />
            </div>
            <p className="font-mono text-[10px] tracking-[0.22em] text-white/45 uppercase">
              Application submitted
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              We&apos;re reviewing your profile
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/65">
              Thanks for applying to CastFlow. A real human admin will look over your
              profile — usually within 48 hours. We&apos;ll email you the moment
              there&apos;s a decision.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              You can close this tab — there&apos;s nothing else to do for now.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={handleRefetch}
                disabled={isFetching || onCooldown}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                {isFetching
                  ? 'Checking…'
                  : onCooldown
                    ? `Check again in ${remaining}s`
                    : 'Check application status'}
              </button>

              <Link
                href="/"
                className="inline-flex items-center text-sm text-white/45 transition hover:text-white"
              >
                Back to homepage
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
