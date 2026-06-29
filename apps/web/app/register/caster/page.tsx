import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { RegisterProgress } from '@/components/auth/register-progress'
import { redirectIfAuthenticated } from '@/lib/auth-server'
import { RegisterCasterForm } from './register-form'

export const metadata = {
  title: 'Create caster account — CastFlow',
  description: 'Post shoots, book verified UK talent. Start with a free trial.',
}

export default async function RegisterCasterPage() {
  await redirectIfAuthenticated()
  return (
    <AuthShell
      eyebrow="For brands & agencies"
      topAccessory={<RegisterProgress current={1} />}
      heading="Open your caster account."
      subhead="Account first. Verify your email and you're ready to post jobs and browse talent."
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
