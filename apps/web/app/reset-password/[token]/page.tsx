import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { ResetPasswordForm } from '../reset-form'

export const metadata = {
  title: 'Choose a new password — CastFlow',
}

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function ResetPasswordTokenPage({ params }: PageProps) {
  const { token } = await params
  return (
    <AuthShell
      eyebrow="Almost there"
      heading="Choose a new password."
      subhead="Pick a strong one you don't use elsewhere."
      width="sm"
      footer={
        <>
          Changed your mind?{' '}
          <Link
            href="/login"
            className="font-medium text-white underline-offset-4 hover:underline"
          >
            Back to log in
          </Link>
        </>
      }
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  )
}
