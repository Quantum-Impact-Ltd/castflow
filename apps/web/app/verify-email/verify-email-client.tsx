'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Send } from 'lucide-react'
import { z } from 'zod'
import { AuthField, AuthInput } from '@/components/auth/auth-form-fields'
import { useResendVerification } from '@/lib/hooks/use-auth'

const emailSchema = z.string().trim().email()
const RESEND_COOLDOWN_SECONDS = 30

export function VerifyEmailClient() {
  const params = useSearchParams()
  const initialEmail = params.get('email') ?? ''
  const [email, setEmail] = useState(initialEmail)
  const mutation = useResendVerification()

  // Client-side cooldown so the user can't button-mash the resend (which would
  // otherwise burn through the API's per-email/IP rate-limit bucket and start
  // 429'ing them). Mirrors the M22 pattern on /onboarding/pending. (Audit L3.)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (cooldownUntil <= now) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [cooldownUntil, now])

  const remaining = Math.max(0, Math.ceil((cooldownUntil - now) / 1000))
  const onCooldown = remaining > 0

  const handleResend = () => {
    if (onCooldown || mutation.isPending) return
    // Validate client-side before hitting the (now rate-limited) server.
    // Without this, any string was POSTed and burned a bucket slot. (Audit H4.)
    const parsed = emailSchema.safeParse(email)
    if (!parsed.success) {
      toast.error('Enter a valid email to resend the verification link.')
      return
    }
    setCooldownUntil(Date.now() + RESEND_COOLDOWN_SECONDS * 1000)
    mutation.mutate(parsed.data, {
      onSuccess: () =>
        toast.success('Verification email re-sent. Check your inbox.'),
    })
  }

  return (
    <div className="space-y-4">
      {initialEmail && (
        <p className="text-center text-xs text-white/55">
          Sent to{' '}
          <span className="font-medium text-white/85">{initialEmail}</span>
          {' — '}
          <a href="/register" className="text-[#f9a26c] underline-offset-4 hover:underline">
            Wrong email?
          </a>
        </p>
      )}
      <p className="text-center font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
        Didn&apos;t get it?
      </p>
      <AuthField label="Your email" htmlFor="resend-email">
        <AuthInput
          id="resend-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </AuthField>
      <button
        type="button"
        onClick={handleResend}
        disabled={mutation.isPending || onCooldown}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] text-sm font-medium text-white transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Send className="h-4 w-4" aria-hidden />
        {mutation.isPending
          ? 'Sending…'
          : onCooldown
            ? `Resend in ${remaining}s`
            : 'Resend verification email'}
      </button>
    </div>
  )
}
