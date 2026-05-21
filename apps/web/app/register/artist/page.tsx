import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { RegisterProgress } from '@/components/auth/register-progress'
import { redirectIfAuthenticated } from '@/lib/auth-server'
import { RegisterArtistForm } from './register-form'

export const metadata = {
  title: 'Create artist account — CastFlow',
  description: 'Apply to join CastFlow as a verified UK artist.',
}

export default async function RegisterArtistPage() {
  await redirectIfAuthenticated()
  return (
    <AuthShell
      eyebrow="For models & actors"
      topAccessory={<RegisterProgress current={1} />}
      heading={
        <>
          Apply as an{' '}
          <span className="bg-gradient-to-br from-[var(--brand-300)] to-[var(--brand-700)] bg-clip-text font-serif italic text-transparent">
            artist.
          </span>
        </>
      }
      subhead="Create your account. You'll build your portfolio in the next step."
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
