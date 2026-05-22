'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { verifyEmailToken } from '@/lib/api/auth'

type Status = 'idle' | 'pending' | 'success' | 'error'

interface VerifyTokenClientProps {
  token: string
}

export function VerifyTokenClient({ token }: VerifyTokenClientProps) {
  const [status, setStatus] = useState<Status>('idle')

  const handleConfirm = async () => {
    setStatus('pending')
    try {
      await verifyEmailToken(token)
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
          <span
            aria-hidden
            className="absolute inset-0 animate-ping rounded-full bg-emerald-400/15"
          />
          <CheckCircle2 className="relative h-6 w-6" aria-hidden />
        </span>
        <p className="text-sm leading-relaxed text-white/75">
          Your email is confirmed. Sign in to set up your profile and start
          using the platform.
        </p>
        <Link
          href="/login"
          className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Continue to log in
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-400/15 text-rose-300">
          <XCircle className="h-6 w-6" aria-hidden />
        </span>
        <p className="text-sm leading-relaxed text-white/75">
          This verification link may have expired or already been used. Request
          a fresh email from your inbox, or sign in if you&apos;ve already
          confirmed elsewhere.
        </p>
        <div className="flex w-full flex-col gap-2">
          <Link
            href="/verify-email"
            className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Resend verification email
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
          >
            Back to log in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <p className="text-sm leading-relaxed text-white/75">
        Click the button below to confirm your email address and activate your
        account.
      </p>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={status === 'pending'}
        className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'pending' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Confirming…
          </>
        ) : (
          <>
            Confirm my email
            <ArrowRight className="h-4 w-4" aria-hidden />
          </>
        )}
      </button>
      <p className="text-xs text-white/55">
        Links expire 24 hours after they&apos;re sent.
      </p>
    </div>
  )
}
