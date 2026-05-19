import Link from 'next/link'
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'

export const metadata = {
  title: 'Verifying email — CastFlow',
}

interface PageProps {
  params: Promise<{ token: string }>
}

async function verifyToken(token: string): Promise<boolean> {
  const apiUrl = process.env['NEXT_PUBLIC_API_URL']
  if (!apiUrl) return false
  try {
    const res = await fetch(
      `${apiUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`,
      { cache: 'no-store', redirect: 'manual' },
    )
    // Better Auth returns 200 on success or a 302 redirect; treat both as ok.
    return res.ok || (res.status >= 300 && res.status < 400)
  } catch {
    return false
  }
}

export default async function VerifyEmailTokenPage({ params }: PageProps) {
  const { token } = await params
  const ok = await verifyToken(token)

  if (!ok) {
    return (
      <AuthShell
        eyebrow="Verification failed"
        heading={
          <>
            Link{' '}
            <span className="bg-gradient-to-br from-rose-300 to-rose-500 bg-clip-text font-serif italic text-transparent">
              expired.
            </span>
          </>
        }
        subhead="This verification link may have expired or already been used."
        width="sm"
      >
        <div className="flex flex-col items-center gap-5 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-400/15 text-rose-300">
            <XCircle className="h-6 w-6" aria-hidden />
          </span>
          <p className="text-sm leading-relaxed text-white/75">
            Request a fresh verification email from your inbox — or sign in
            below if you&apos;ve already confirmed elsewhere.
          </p>
          <div className="flex w-full flex-col gap-2">
            <Link
              href="/verify-email"
              className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-[#f9a26c] text-sm font-semibold text-[#1c1108] transition-colors hover:bg-[#f9a26c]/90"
            >
              Resend verification email
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
            >
              Back to log in
            </Link>
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Verified"
      heading={
        <>
          You&apos;re{' '}
          <span className="bg-gradient-to-br from-[var(--brand-300)] to-[var(--brand-700)] bg-clip-text font-serif italic text-transparent">
            in.
          </span>
        </>
      }
      subhead="Your email is confirmed. Welcome to CastFlow."
      width="sm"
    >
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
          <span
            aria-hidden
            className="absolute inset-0 animate-ping rounded-full bg-emerald-400/15"
          />
          <CheckCircle2 className="relative h-6 w-6" aria-hidden />
        </span>
        <p className="text-sm leading-relaxed text-white/75">
          Sign in to set up your profile and start using the platform.
        </p>
        <Link
          href="/login"
          className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-[#f9a26c] px-4 text-sm font-semibold text-[#1c1108] transition-colors hover:bg-[#f9a26c]/90"
        >
          Continue to log in
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </AuthShell>
  )
}
