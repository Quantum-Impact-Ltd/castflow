'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowRight } from 'lucide-react'
import {
  registerArtistSchema,
  type RegisterArtistInput,
} from '@castflow/validators'
import {
  AuthField,
  AuthInput,
} from '@/components/auth/auth-form-fields'
import { PasswordInput } from '@/components/auth/password-input'
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter'
import { useRegisterArtist } from '@/lib/hooks/use-auth'
import {
  TurnstileWidget,
  isTurnstileEnabled,
} from '@/components/auth/turnstile-widget'
import type { ApiError } from '@/lib/fetcher'

const formSchema = registerArtistSchema
  .extend({ confirmPassword: z.string().min(1) })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof formSchema>

export function RegisterArtistForm() {
  const router = useRouter()
  const mutation = useRegisterArtist()
  const [serverError, setServerError] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaEnabled = isTurnstileEnabled()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      dob: '',
    },
  })

  // 18 years ago today — sets the latest selectable date on the picker so
  // the picker UI itself reflects the 18+ rule. The zod schema is still the
  // source of truth.
  const dobMax = (() => {
    const d = new Date()
    d.setFullYear(d.getFullYear() - 18)
    return d.toISOString().slice(0, 10)
  })()

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null)
    if (captchaEnabled && !captchaToken) {
      setServerError('Please complete the captcha to continue.')
      return
    }
    const { confirmPassword: _confirm, ...rest } = values
    void _confirm
    const payload: RegisterArtistInput & { captchaToken?: string } = {
      ...(rest as RegisterArtistInput),
      ...(captchaToken ? { captchaToken } : {}),
    }
    mutation.mutate(payload, {
      onSuccess: (result) => {
        // Dev bypass: account is already verified, send straight to login so
        // they can sign in without checking email. Production keeps the
        // "check your inbox" flow.
        if (result.emailVerified) {
          toast.success('Account created — log in to continue')
          router.push(`/login?email=${encodeURIComponent(payload.email)}`)
          return
        }
        toast.success('Account created — check your email to verify')
        router.push(`/verify-email?email=${encodeURIComponent(payload.email)}`)
      },
      onError: (err) => {
        const apiErr = err as ApiError
        if (apiErr.fields) {
          for (const [field, msgs] of Object.entries(apiErr.fields)) {
            form.setError(field as keyof FormValues, {
              type: 'server',
              message: msgs[0],
            })
          }
        } else {
          setServerError(apiErr.message)
        }
      },
    })
  })

  return (
    <form
      onSubmit={(e) => {
        void onSubmit(e)
      }}
      className="space-y-5"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <AuthField
          label="First name"
          htmlFor="firstName"
          error={form.formState.errors.firstName?.message}
        >
          <AuthInput
            id="firstName"
            autoComplete="given-name"
            placeholder="Maya"
            autoFocus
            aria-invalid={!!form.formState.errors.firstName}
            {...form.register('firstName')}
          />
        </AuthField>
        <AuthField
          label="Last name"
          htmlFor="lastName"
          error={form.formState.errors.lastName?.message}
        >
          <AuthInput
            id="lastName"
            autoComplete="family-name"
            placeholder="Okafor"
            aria-invalid={!!form.formState.errors.lastName}
            {...form.register('lastName')}
          />
        </AuthField>
      </div>

      <AuthField
        label="Date of birth"
        htmlFor="dob"
        error={form.formState.errors.dob?.message}
        hint={
          <span className="text-[10px] uppercase tracking-[0.16em] text-white/70">
            18+ only
          </span>
        }
      >
        <AuthInput
          id="dob"
          type="date"
          autoComplete="bday"
          max={dobMax}
          aria-invalid={!!form.formState.errors.dob}
          {...form.register('dob')}
        />
      </AuthField>

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

      <AuthField
        label="Password"
        htmlFor="password"
        error={form.formState.errors.password?.message}
        hint={
          <span className="text-[10px] uppercase tracking-[0.16em] text-white/70">
            8+ chars · 1 num · 1 sym
          </span>
        }
      >
        <PasswordInput
          id="password"
          autoComplete="new-password"
          placeholder="••••••••"
          aria-invalid={!!form.formState.errors.password}
          {...form.register('password')}
        />
        <PasswordStrengthMeter password={form.watch('password')} />
      </AuthField>

      <AuthField
        label="Confirm password"
        htmlFor="confirmPassword"
        error={form.formState.errors.confirmPassword?.message}
      >
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          placeholder="••••••••"
          aria-invalid={!!form.formState.errors.confirmPassword}
          {...form.register('confirmPassword')}
        />
      </AuthField>

      {serverError ? (
        <p
          role="alert"
          className="rounded-lg border border-rose-400/30 bg-rose-400/[0.08] px-3 py-2 text-sm text-rose-200"
        >
          {serverError}
        </p>
      ) : null}

      {captchaEnabled && (
        <TurnstileWidget
          onVerify={setCaptchaToken}
          onExpire={() => setCaptchaToken(null)}
        />
      )}

      <button
        type="submit"
        disabled={mutation.isPending || (captchaEnabled && !captchaToken)}
        aria-busy={mutation.isPending}
        className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink-900)]"
      >
        {mutation.isPending ? 'Creating account…' : 'Create artist account'}
        {!mutation.isPending ? (
          <ArrowRight className="h-4 w-4" aria-hidden />
        ) : null}
      </button>

      <p className="text-center text-xs text-white/50">
        By registering you agree to our{' '}
        <Link
          href="/terms"
          className="text-white/75 underline-offset-4 hover:text-white hover:underline"
        >
          Terms
        </Link>{' '}
        and{' '}
        <Link
          href="/privacy"
          className="text-white/75 underline-offset-4 hover:text-white hover:underline"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  )
}
