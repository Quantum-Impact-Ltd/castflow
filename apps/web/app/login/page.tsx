import { Suspense } from 'react'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from './login-form'

export const metadata = {
  title: 'Log in — CastFlow',
  description: 'Sign in to your CastFlow account.',
}

export default function LoginPage() {
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
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  )
}
