'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, MailCheck } from 'lucide-react'
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@castflow/validators'
import { AuthField, AuthInput } from '@/components/auth/auth-form-fields'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { useForgotPassword } from '@/lib/hooks/use-auth'

export function ForgotPasswordForm() {
  const mutation = useForgotPassword()
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(values, {
      // Always render the success state — never reveal whether the email exists.
      onSettled: () => setSubmitted(true),
    })
  })

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--cta-400)]/15 text-[var(--cta-400)]">
          <MailCheck className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-sm leading-relaxed text-white/85">
          If an account exists for that email, we&apos;ve sent a password-reset
          link. Check your inbox.
        </p>
        <p className="text-xs text-white/45">
          Didn&apos;t arrive? Check spam, or wait a minute and try again.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        void onSubmit(e)
      }}
      className="space-y-5"
      noValidate
    >
      <AuthField
        label="Email"
        htmlFor="email"
        error={form.formState.errors.email?.message}
      >
        <AuthInput
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          aria-invalid={!!form.formState.errors.email}
          {...form.register('email')}
        />
      </AuthField>

      <ShimmerButton
        type="submit"
        disabled={mutation.isPending}
        background="linear-gradient(135deg, var(--cta-400) 0%, var(--cta-500) 100%)"
        shimmerColor="#ffffff"
        className="h-12 w-full px-6 text-sm font-semibold"
      >
        {mutation.isPending ? 'Sending…' : 'Send reset link'}
        {!mutation.isPending ? (
          <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
        ) : null}
      </ShimmerButton>
    </form>
  )
}
