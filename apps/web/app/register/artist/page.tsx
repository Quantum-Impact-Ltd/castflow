import Link from 'next/link'
import { RegisterArtistForm } from './register-form'

export default function RegisterArtistPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="mb-6">
        <Link href="/register" className="text-muted-foreground text-xs hover:underline">
          ← Back
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Create an artist account</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          You&apos;ll complete your profile after verifying your email.
        </p>
      </div>
      <RegisterArtistForm />
      <p className="text-muted-foreground mt-6 text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
