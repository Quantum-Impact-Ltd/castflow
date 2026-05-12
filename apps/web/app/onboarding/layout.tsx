import Link from 'next/link'

const STEPS = [
  { href: '/onboarding/personal', label: 'Personal' },
  { href: '/onboarding/stats', label: 'Stats' },
  { href: '/onboarding/experience', label: 'Experience' },
  { href: '/onboarding/portfolio', label: 'Portfolio' },
  { href: '/onboarding/verification', label: 'ID' },
  { href: '/onboarding/review', label: 'Review' },
] as const

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-sm font-semibold">
            CastFlow
          </Link>
          <p className="text-muted-foreground text-xs">Profile setup</p>
        </div>
        <nav className="mx-auto max-w-3xl px-4 pb-4">
          <ol className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {STEPS.map((s, i) => (
              <li key={s.href} className="flex items-center gap-2">
                {i > 0 && <span>›</span>}
                <Link href={s.href} className="hover:text-foreground hover:underline">
                  {i + 1}. {s.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-10">{children}</main>
    </div>
  )
}
