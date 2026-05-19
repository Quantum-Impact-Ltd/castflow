import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { ForgotPasswordForm } from './forgot-form'

export const metadata = {
  title: 'Reset password — CastFlow',
  description: 'Request a password-reset link.',
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Reset password"
      heading={
        <>
          Forgot your{' '}
          <span className="bg-gradient-to-br from-[var(--brand-300)] to-[var(--brand-700)] bg-clip-text font-serif italic text-transparent">
            password?
          </span>
        </>
      }
      subhead="Enter your email and we'll send a reset link if an account exists."
      width="sm"
      footer={
        <>
          Remembered it?{' '}
          <Link
            href="/login"
            className="font-medium text-white underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
