import { Suspense } from 'react'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { redirectIfAuthenticated } from '@/lib/auth-server'
import { LoginForm } from './login-form'

export const metadata = {
  title: 'Log in — CastFlow',
  description: 'Sign in to your CastFlow account.',
}

function LoginFormSkeleton() {
  return (
    <div className="space-y-5" aria-hidden>
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="h-3 w-12 rounded bg-white/10" />
          <div className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04]" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-3 w-16 rounded bg-white/10" />
            <div className="h-3 w-10 rounded bg-white/10" />
          </div>
          <div className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04]" />
        </div>
        <div className="h-12 w-full rounded-xl bg-white/[0.06]" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <div className="h-3 w-6 rounded bg-white/10" />
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <div className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.04]" />
    </div>
  )
}

export default async function LoginPage() {
  await redirectIfAuthenticated()
  return (
    <AuthShell
      eyebrow="Welcome back"
      heading={
        <>
          Sign in to{' '}
          <span className="bg-gradient-to-br from-[var(--brand-300)] to-[var(--brand-700)] bg-clip-text font-serif italic text-transparent">
            CastFlow.
          </span>
        </>
      }
      subhead="Pick up where you left off."
      footer={
        <>
          New to CastFlow?{' '}
          <Link
            href="/register"
            className="font-medium text-white underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
