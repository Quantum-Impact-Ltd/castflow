import { Suspense } from 'react'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { RegisterProgress } from '@/components/auth/register-progress'
import { redirectIfAuthenticated } from '@/lib/auth-server'
import { VerifyEmailClient } from './verify-email-client'

export const metadata = {
  title: 'Check your inbox — CastFlow',
  description: 'We sent a verification link to your email.',
}

function VerifyEmailClientSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="mx-auto h-3 w-32 rounded bg-white/10" />
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-white/10" />
        <div className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04]" />
      </div>
      <div className="h-11 w-full rounded-xl bg-white/[0.06]" />
    </div>
  )
}

export default async function VerifyEmailPage() {
  // If the user is already authenticated (incl. dev-bypass auto-verified),
  // skip the "check your inbox" screen and send them to their dashboard.
  await redirectIfAuthenticated()
  return (
    <AuthShell
      eyebrow="One more step"
      topAccessory={<RegisterProgress current={2} />}
      heading={
        <>
          Check your{' '}
          <span className="bg-gradient-to-br from-[var(--brand-300)] to-[var(--brand-700)] bg-clip-text font-serif italic text-transparent">
            inbox.
          </span>
        </>
      }
      subhead="We've sent you a verification link. Click it to activate your account."
      width="sm"
      footer={
        <>
          Already verified?{' '}
          <Link
            href="/login"
            className="font-medium text-white underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#f9a26c]/15 text-[#f9a26c]">
          <span
            aria-hidden
            className="absolute inset-0 animate-ping rounded-full bg-[#f9a26c]/20"
          />
          <Mail className="relative h-6 w-6" aria-hidden />
        </span>
        <p className="text-sm leading-relaxed text-white/75">
          Check spam if it&apos;s not in your inbox within a minute. The link
          expires in 24 hours.
        </p>
      </div>

      <div className="mt-6 border-t border-white/10 pt-6">
        <Suspense fallback={<VerifyEmailClientSkeleton />}>
          <VerifyEmailClient />
        </Suspense>
      </div>
    </AuthShell>
  )
}
