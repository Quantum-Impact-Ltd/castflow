import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'

export const metadata = {
  title: 'Welcome to CastFlow',
  description: 'Your email is confirmed.',
}

export default function VerifyEmailConfirmedPage() {
  return (
    <AuthShell
      eyebrow="Welcome"
      heading={
        <>
          You&apos;re on{' '}
          <span className="bg-gradient-to-br from-[var(--brand-300)] to-[var(--brand-700)] bg-clip-text font-serif italic text-transparent">
            CastFlow.
          </span>
        </>
      }
      subhead="Your email is confirmed. Time to set things up."
      width="sm"
    >
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#f9a26c]/15 text-[#f9a26c]">
          <span
            aria-hidden
            className="absolute inset-0 animate-ping rounded-full bg-[#f9a26c]/20"
          />
          <Sparkles className="relative h-6 w-6" aria-hidden />
        </span>
        <p className="text-sm leading-relaxed text-white/75">
          Sign in and finish your profile. Casters can post a shoot
          straight away. Artists head into onboarding for approval.
        </p>
        <Link
          href="/login"
          className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-[#f9a26c] px-4 text-sm font-semibold text-[#1c1108] transition-colors hover:bg-[#f9a26c]/90"
        >
          Continue to log in
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </AuthShell>
  )
}
