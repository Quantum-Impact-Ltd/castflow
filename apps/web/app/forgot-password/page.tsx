import Link from 'next/link'
import { ForgotPasswordForm } from './forgot-form'

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Enter your email and we&apos;ll send a reset link if an account exists.
      </p>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
      <p className="text-muted-foreground mt-6 text-center text-sm">
        Remembered it?{' '}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
