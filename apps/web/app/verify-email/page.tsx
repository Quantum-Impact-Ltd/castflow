import { Suspense } from 'react'
import Link from 'next/link'
import { VerifyEmailClient } from './verify-email-client'

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        We&apos;ve sent you a verification link. Click it to activate your account.
      </p>
      <div className="mt-6">
        <Suspense fallback={null}>
          <VerifyEmailClient />
        </Suspense>
      </div>
      <p className="text-muted-foreground mt-6 text-center text-sm">
        Already verified?{' '}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
