'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight } from 'lucide-react'
import { loginSchema, type LoginInput } from '@castflow/validators'
import { AuthField, AuthInput } from '@/components/auth/auth-form-fields'
import { PasswordInput } from '@/components/auth/password-input'
import { useLogin } from '@/lib/hooks/use-auth'
import { postLoginPath } from '@/lib/auth-redirect'
import { safeInternalRedirect } from '@/lib/safe-redirect'

export function LoginForm() {
  const searchParams = useSearchParams()
  const mutation = useLogin()
  const [serverError, setServerError] = useState<string | null>(null)

  // The auth middleware redirects unauthenticated traffic to /login?next=…,
  // so read the same `next` param here (it used to read `redirect`, which the
  // middleware never sets — redirect-back silently never fired).
  const safeRedirect = safeInternalRedirect(searchParams.get('next'))

  // Prefill email when arriving from the register flow's duplicate-email
  // redirect (or any deep link of the form /login?email=…). We hard-cap
  // length and require '@' to avoid letting an attacker craft a /login link
  // that injects giant or junk strings into the field.
  const rawEmail = searchParams.get('email') ?? ''
  const prefilledEmail =
    rawEmail.length > 0 && rawEmail.length <= 254 && rawEmail.includes('@')
      ? rawEmail
      : ''

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: prefilledEmail, password: '' },
  })

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null)
    mutation.mutate(values, {
      onSuccess: (data) => {
        const target = safeRedirect ?? postLoginPath(data.user)
        // Hard navigation so server-rendered layouts (route guards) re-evaluate
        // session immediately. router.push keeps stale RSC cache and the user
        // can briefly see the wrong shell.
        window.location.href = target
      },
      onError: (err) => {
        const e = err as Error & { code?: string; status?: number }
        // Match on the canonical code only — `status === 403` alone is too
        // broad (a banned/suspended account also returns 403, and "verify
        // your email" would be misleading there). Better Auth always sets
        // `code: 'EMAIL_NOT_VERIFIED'` on the unverified-login path. (Audit L6.)
        if (e.code === 'EMAIL_NOT_VERIFIED') {
          setServerError('Please verify your email before logging in.')
        } else if (e.status === 401) {
          setServerError('Incorrect email or password.')
        } else {
          setServerError(e.message || 'Could not log in.')
        }
      },
    })
  })

  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          void onSubmit(e)
        }}
        noValidate
        className="space-y-5"
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
            placeholder="you@studio.co.uk"
            autoFocus={!prefilledEmail}
            aria-invalid={!!form.formState.errors.email}
            {...form.register('email')}
          />
        </AuthField>

        <AuthField
          label="Password"
          htmlFor="password"
          error={form.formState.errors.password?.message}
          hint={
            <Link
              href="/forgot-password"
              className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/50 transition-colors hover:text-[var(--cta-400)]"
            >
              Forgot?
            </Link>
          }
        >
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            autoFocus={!!prefilledEmail}
            aria-invalid={!!form.formState.errors.password}
            {...form.register('password')}
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

        <button
          type="submit"
          disabled={mutation.isPending}
          aria-busy={mutation.isPending}
          className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink-900)]"
        >
          {mutation.isPending ? 'Logging in…' : 'Log in'}
          {!mutation.isPending ? (
            <ArrowRight className="h-4 w-4" aria-hidden />
          ) : null}
        </button>
      </form>
    </div>
  )
}
