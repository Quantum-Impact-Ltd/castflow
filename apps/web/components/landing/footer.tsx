import Link from 'next/link'
import { Marquee } from './marquee'

const FOOTER_STRIP = [
  'Made in the UK',
  'Casting infrastructure',
  'Est. 2026',
  'Verified artists',
  'Free for artists',
  'Contracts built in',
]

const FOOTER_GROUPS = [
  {
    title: 'Platform',
    links: [
      { href: '/how-it-works', label: 'How it works' },
      { href: '/casters', label: 'For casters' },
      { href: '/artists', label: 'For artists' },
      { href: '/talent', label: 'Browse talent' },
      { href: '/shoots', label: 'Live shoots' },
    ],
  },
  {
    title: 'Trust',
    links: [
      { href: '/trust', label: 'How we verify' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/terms', label: 'Terms of service' },
      { href: '/privacy', label: 'Privacy policy' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      {/* Top motion strip — slow continuous marquee of brand attributes */}
      <div className="relative overflow-hidden border-b border-border/60 bg-[var(--surface-50)] py-5">
        <Marquee
          items={FOOTER_STRIP}
          durationSeconds={60}
          gap={48}
          itemClassName="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-foreground/70"
          separator={
            <span className="text-primary" aria-hidden>
              ✱
            </span>
          }
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[var(--surface-50)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--surface-50)] to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-[90rem] px-6 py-16 lg:px-8 lg:py-20">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 text-lg font-medium tracking-tight"
            >
              <span
                className="inline-block h-2 w-2 rounded-full bg-primary transition-transform duration-500 group-hover:scale-150"
                aria-hidden
              />
              CastFlow
            </Link>
            <p className="mt-5 max-w-xs text-sm font-medium leading-relaxed text-foreground/75">
              The UK casting platform built on contracts, verified talent, and
              reputation.
            </p>
          </div>
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80">
                {group.title}
              </h3>
              <ul className="mt-5 space-y-3.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group relative inline-flex text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {link.label}
                      <span
                        aria-hidden
                        className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-8 md:flex-row md:items-center">
          <p className="text-xs font-medium text-foreground/70">
            © {new Date().getFullYear()} CastFlow Ltd · Made in the UK
          </p>
          <p className="text-xs font-medium text-foreground/70">
            Casters subscribe. Artists join free.
          </p>
        </div>
      </div>
    </footer>
  )
}
