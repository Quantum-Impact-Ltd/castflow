'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight } from 'lucide-react'
import { loginSchema, type LoginInput } from '@castflow/validators'
import { AuthDivider, AuthField, AuthInput } from '@/components/auth/auth-shell'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { useLogin } from '@/lib/hooks/use-auth'
import { getSession } from '@/lib/api/auth'
import { postLoginPath } from '@/lib/auth-redirect'
import { authClient } from '@/lib/auth-client'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mutation = useLogin()
  const [serverError, setServerError] = useState<string | null>(null)

  const rawRedirect = searchParams.get('redirect')
  const safeRedirect =
    rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : null

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null)
    mutation.mutate(values, {
      onSuccess: () => {
        void getSession().then((session) => {
          if (safeRedirect) {
            router.push(safeRedirect)
            return
          }
          if (session?.user) {
            router.push(postLoginPath(session.user))
          } else {
            router.push('/')
          }
        })
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
          <AuthInput
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
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
    </div>
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
