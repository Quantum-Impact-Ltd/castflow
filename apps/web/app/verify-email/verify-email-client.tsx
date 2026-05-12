'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useResendVerification } from '@/lib/hooks/use-auth'
import { toast } from 'sonner'

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
      onSuccess: () => toast.success('Verification email re-sent. Check your inbox.'),
    })
  }

  return (
    <div className="space-y-4">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
      />
      <Button
        type="button"
        onClick={handleResend}
        disabled={mutation.isPending}
        variant="outline"
        className="w-full"
      >
        {mutation.isPending ? 'Sending…' : 'Resend verification email'}
      </Button>
    </div>
  )
}
