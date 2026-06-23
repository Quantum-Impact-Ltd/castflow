import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { ShieldAlert, Mail } from 'lucide-react'
import { auth } from '@/lib/auth-server'

export const metadata: Metadata = {
  title: 'Account suspended — CastFlow',
  description: 'Your CastFlow account has been suspended.',
  robots: { index: false, follow: false },
}

export default async function SuspendedPage() {
  // Gate this page so casual visitors / curious users / bots can't load it.
  // Only signed-in users whose status is actually suspended or banned see
  // it. Everyone else gets bounced home. (Audit H10 + L18.)
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null)
  if (!session?.user) redirect('/login')
  const status = (session.user as { status?: string }).status
  if (status !== 'suspended' && status !== 'banned') redirect('/')

  return (
    <div className="relative isolate grid min-h-screen w-full place-items-center overflow-hidden bg-[var(--ink-900)] px-4 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-rose-500 opacity-[0.10] blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-[-12rem] h-[32rem] w-[32rem] rounded-full bg-[var(--brand-700)] opacity-[0.16] blur-[140px]"
      />

      <div className="relative z-10 mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full border border-rose-400/30 bg-rose-400/[0.10]">
          <ShieldAlert className="h-6 w-6 text-rose-300" />
        </div>
        <p className="font-mono text-[10px] tracking-[0.22em] text-white/70 uppercase">
          Access restricted
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Your account is on hold
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/65">
          We&apos;ve temporarily suspended this account. This usually happens when
          activity on the platform triggers a manual review by our Trust &amp; Safety
          team.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-white/65">
          If you think this is a mistake — or you&apos;d like to appeal — reach out and
          we&apos;ll get back to you within two working days.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <a
            href="mailto:trust@castflow.co.uk?subject=Account%20appeal"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--cta-400)] px-5 text-sm font-semibold text-[#1c1108] transition-colors hover:bg-[var(--cta-400)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta-400)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink-900)]"
          >
            <Mail className="h-4 w-4" />
            Contact Trust &amp; Safety
          </a>
          <Link
            href="/"
            className="text-xs text-white/70 transition hover:text-white"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
