import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { RegisterCasterForm } from './register-form'

export const metadata = {
  title: 'Create caster account — CastFlow',
  description: 'Post shoots, book verified UK talent. Start with a free trial.',
}

export default function RegisterCasterPage() {
  return (
    <AuthShell
      eyebrow="For brands & agencies"
      heading={
        <>
          Open your{' '}
          <span className="bg-gradient-to-br from-[var(--brand-300)] to-[var(--brand-700)] bg-clip-text font-serif italic text-transparent">
            caster account.
          </span>
        </>
      }
      subhead="You'll be able to post jobs as soon as you verify your email."
      width="lg"
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
      <RegisterCasterForm />
    </AuthShell>
  )
}
