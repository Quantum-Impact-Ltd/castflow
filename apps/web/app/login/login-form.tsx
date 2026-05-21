'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight } from 'lucide-react'
import { loginSchema, type LoginInput } from '@castflow/validators'
import {
  AuthDivider,
  AuthField,
  AuthInput,
} from '@/components/auth/auth-form-fields'
import { PasswordInput } from '@/components/auth/password-input'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { useLogin } from '@/lib/hooks/use-auth'
import { postLoginPath } from '@/lib/auth-redirect'
import { authClient } from '@/lib/auth-client'
import { safeInternalRedirect } from '@/lib/safe-redirect'

export function LoginForm() {
  const searchParams = useSearchParams()
  const mutation = useLogin()
  const [serverError, setServerError] = useState<string | null>(null)

  const safeRedirect = safeInternalRedirect(searchParams.get('redirect'))

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
        if (e.code === 'EMAIL_NOT_VERIFIED' || e.status === 403) {
          setServerError('Please verify your email before logging in.')
        } else if (e.status === 401) {
          setServerError('Incorrect email or password.')
        } else {
          setServerError(e.message || 'Could not log in.')
        }
      },
    })
  })

  const handleGoogle = () => {
    setServerError(null)
    authClient.signIn
      .social({ provider: 'google', callbackURL: safeRedirect ?? '/' })
      .catch((err: unknown) => {
        setServerError((err as Error).message || 'Google sign-in failed.')
      })
  }

  const handleApple = () => {
    setServerError(null)
    authClient.signIn
      .social({ provider: 'apple', callbackURL: safeRedirect ?? '/' })
      .catch((err: unknown) => {
        setServerError((err as Error).message || 'Apple sign-in failed.')
      })
  }

  // Backend supports Apple via `socialProviders.apple` when APPLE_CLIENT_ID /
  // APPLE_CLIENT_SECRET are set. Gate the UI on a build-time public flag so
  // we can roll out the credentials before exposing the button. (Audit L4.)
  const appleEnabled = process.env['NEXT_PUBLIC_APPLE_ENABLED'] === 'true'

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
              className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/50 transition-colors hover:text-[#f9a26c]"
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

        <ShimmerButton
          type="submit"
          disabled={mutation.isPending}
          background="linear-gradient(135deg, #f9a26c 0%, #e67e3e 100%)"
          shimmerColor="#ffffff"
          className="h-12 w-full px-6 text-sm font-semibold"
        >
          {mutation.isPending ? 'Logging in…' : 'Log in'}
          {!mutation.isPending ? (
            <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
          ) : null}
        </ShimmerButton>
      </form>

      <AuthDivider />

      <button
        type="button"
        onClick={handleGoogle}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
      >
        <GoogleGlyph />
        Continue with Google
      </button>

      {appleEnabled ? (
        <button
          type="button"
          onClick={handleApple}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
        >
          <AppleGlyph />
          Continue with Apple
        </button>
      ) : null}
    </div>
  )
}

function AppleGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-4 w-4 fill-current"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M16.365 1.43c0 1.14-.46 2.234-1.213 3.022-.82.85-2.13 1.51-3.21 1.42-.137-1.122.41-2.275 1.16-3.013.84-.85 2.26-1.503 3.263-1.43zM20.5 17.27c-.39.9-.58 1.31-1.08 2.11-.7 1.12-1.69 2.51-2.92 2.52-1.1.01-1.38-.71-2.86-.7-1.49.01-1.8.72-2.9.71-1.23-.01-2.17-1.27-2.87-2.39-1.95-3.13-2.15-6.81-.95-8.77.85-1.39 2.19-2.21 3.46-2.21 1.29 0 2.1.71 3.16.71 1.03 0 1.66-.71 3.15-.71 1.13 0 2.33.62 3.18 1.69-2.8 1.54-2.34 5.55.63 7.04z" />
    </svg>
  )
}

function GoogleGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 18 18"
      className="h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}
