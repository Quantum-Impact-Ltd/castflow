import { AuthShell } from '@/components/auth/auth-shell'
import { VerifyTokenClient } from './verify-token-client'

export const metadata = {
  title: 'Confirm your email — CastFlow',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ token: string }>
}

// IMPORTANT: this page must NOT consume the verification token on render.
// Email-link prefetchers (Outlook Safe Links, Gmail link-warming, AV
// scanners) will hit the URL before the user clicks — if the page mutates
// on render the token gets burned and the user lands on "expired". The
// token is only POSTed when the user explicitly clicks Confirm in the
// client component below.
export default async function VerifyEmailTokenPage({ params }: PageProps) {
  const { token } = await params

  return (
    <AuthShell
      eyebrow="One last step"
      heading={
        <>
          Confirm your{' '}
          <span className="bg-gradient-to-br from-[var(--brand-300)] to-[var(--brand-700)] bg-clip-text font-serif italic text-transparent">
            email.
          </span>
        </>
      }
      subhead="We just need to confirm it was really you who signed up."
      width="sm"
    >
      <VerifyTokenClient token={token} />
    </AuthShell>
  )
}
