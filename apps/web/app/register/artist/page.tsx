import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { RegisterArtistForm } from './register-form'

export const metadata = {
  title: 'Create artist account — CastFlow',
  description: 'Apply to join CastFlow as a verified UK artist.',
}

export default function RegisterArtistPage() {
  return (
    <AuthShell
      eyebrow="For models & actors"
      heading={
        <>
          Apply as an{' '}
          <span className="bg-gradient-to-br from-[var(--brand-300)] to-[var(--brand-700)] bg-clip-text font-serif italic text-transparent">
            artist.
          </span>
        </>
      }
      subhead="Create your account. You'll complete your profile after verifying your email."
      backHref="/register"
      backLabel="Pick a different role"
      footer={
        <>
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-white underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <RegisterArtistForm />
    </AuthShell>
  )
}
