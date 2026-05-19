'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Send } from 'lucide-react'
import { AuthField, AuthInput } from '@/components/auth/auth-shell'
import { useResendVerification } from '@/lib/hooks/use-auth'

export function VerifyEmailClient() {
  const params = useSearchParams()
  const initialEmail = params.get('email') ?? ''
  const [email, setEmail] = useState(initialEmail)
  const mutation = useResendVerification()

  const handleResend = () => {
    if (!email) {
      toast.error('Enter your email to resend the verification link.')
      return
    }
    mutation.mutate(email, {
      onSuccess: () =>
        toast.success('Verification email re-sent. Check your inbox.'),
    })
  }

  return (
    <div className="space-y-4">
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
        disabled={mutation.isPending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] text-sm font-medium text-white transition-colors hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Send className="h-4 w-4" aria-hidden />
        {mutation.isPending ? 'Sending…' : 'Resend verification email'}
      </button>
    </div>
  )
}
