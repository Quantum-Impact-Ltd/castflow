import Link from 'next/link'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'

export const metadata = {
  title: 'Reset link missing — CastFlow',
}

export default function ResetPasswordPage() {
  // The token-bearing reset page lives at /reset-password/[token].
  // This bare route exists for users who land here without a token — usually
  // after clicking an old or copy-pasted-truncated link.
  return (
    <AuthShell
      eyebrow="Reset password"
      heading="Reset link missing."
      subhead="Your reset link is incomplete or expired. Request a new one to continue."
      width="sm"
      footer={
        <>
          Remembered it?{' '}
          <Link
            href="/login"
            className="font-medium text-white underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <div className="flex flex-col items-center gap-5 py-2 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-sm leading-relaxed text-white/75">
          The link in your email may have expired, been used already, or got
          cut off when pasted. Request a fresh one — it&apos;s instant.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Request a new reset link
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </AuthShell>
  )
}
