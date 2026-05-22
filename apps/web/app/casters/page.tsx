import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Camera,
  Clock,
  Filter,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react'
import { Nav } from '@/components/landing/nav'
import { Footer } from '@/components/landing/footer'
import { Reveal } from '@/components/landing/reveal'
import { Button } from '@/components/ui/button'
import { Marquee } from '@/components/ui/marquee'
import { AvatarCircles } from '@/components/ui/avatar-circles'
import { ShimmerButtonLink } from './shimmer-button-link'

export const metadata: Metadata = {
  title: 'For casters — CastFlow',
  description:
    'Cast verified UK models and actors in days. Search vetted talent, send invites, sign contracts, and pay through escrow — all in one place.',
}

const LOGOS = [
  'Studio West',
  'Hudson & Co.',
  'Northshore Films',
  'Atelier 14',
  'House of Linen',
  'Wave / Brand',
  'Foundry Productions',
  'Linen & Light',
]

const FEATURES = [
  {
    icon: Filter,
    title: 'Search verified UK talent',
    body: 'Filter by city, type, experience, availability, and rating. Every profile is ID-checked, 18+, and admin-approved before they appear.',
  },
  {
    icon: Camera,
    title: 'Post in under five minutes',
    body: 'Brief, budget, dates, usage rights. Public or invite-only. Save templates so your second post takes thirty seconds.',
  },
  {
    icon: Sparkles,
    title: 'Side-by-side bid review',
    body: 'Compare rates, response times, and portfolios in a single view. Shortlist to unlock direct messaging — no off-platform chasing.',
  },
  {
    icon: ShieldCheck,
    title: 'Built-in contracts',
    body: 'Every booking generates an e-signed contract — usage rights, exclusivity, NDA clauses, all wired up. UK ECA 2000 enforceable.',
  },
  {
    icon: Wallet,
    title: 'Stripe escrow protection',
    body: 'Funds ring-fenced until the shoot is confirmed. Auto-released at +48 hours so payouts never get stuck.',
  },
  {
    icon: Clock,
    title: 'No late-payment chasing',
    body: 'The platform handles payouts. Artists keep 100% of the agreed rate, and you get an itemised invoice for every booking.',
  },
]

interface ComparisonRow {
  label: string
  agency: string
  castflow: string
}

const COMPARISON: ComparisonRow[] = [
  { label: 'Time to first booking', agency: '2–4 weeks', castflow: '2–3 days' },
  { label: 'Casting director fee', agency: '£500–2,000', castflow: 'Included' },
  { label: 'Direct artist contact', agency: 'Mediated', castflow: 'After shortlist' },
  { label: 'Contracts', agency: 'Bespoke each time', castflow: 'Auto-generated' },
  { label: 'Escrow protection', agency: 'No', castflow: 'Every booking' },
  { label: 'Dispute resolution', agency: 'Your problem', castflow: '72-hour window' },
  { label: 'Artist verification', agency: 'You vet them', castflow: 'ID + admin approved' },
]

const AVATARS = [
  { imageUrl: 'https://picsum.photos/seed/cast-1/80/80' },
  { imageUrl: 'https://picsum.photos/seed/cast-2/80/80' },
  { imageUrl: 'https://picsum.photos/seed/cast-3/80/80' },
  { imageUrl: 'https://picsum.photos/seed/cast-4/80/80' },
  { imageUrl: 'https://picsum.photos/seed/cast-5/80/80' },
]

export default function CastersPage() {
  return (
    <>
      <Nav />
      <main className="bg-background">
        {/* Hero */}
        <section className="relative w-full overflow-hidden pb-16 pt-20 lg:pb-24 lg:pt-28">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-[var(--surface-50)] px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em]">
                  For casters and brands
                </span>
              </div>

              <h1 className="mt-8 max-w-5xl text-balance text-5xl font-medium leading-[1.04] tracking-[-0.02em] text-foreground sm:text-6xl lg:text-7xl">
                Cast verified UK talent{' '}
                <span className="font-serif font-normal italic">in days,</span> not weeks.
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-foreground/75">
                Search 27,000+ ID-verified models and actors. Post a brief, review bids side by
                side, book in one click, and pay through escrow. No agents, no admin, no chasing
                invoices.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-6">
                <ShimmerButtonLink href="/register?role=caster">
                  Start a free 14-day trial
                  <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                </ShimmerButtonLink>
                <Button asChild variant="outline" size="lg" className="rounded-full">
                  <Link href="/pricing">See pricing</Link>
                </Button>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <AvatarCircles avatarUrls={AVATARS} numPeople={3200} />
                <p className="max-w-md text-sm text-foreground/70">
                  <span className="font-medium text-foreground">3,200+ casters</span> posted a shoot
                  this month — agencies, in-house teams, and freelance producers.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Logos marquee */}
        <section className="border-y border-border/60 bg-[var(--surface-50)] py-10">
          <div className="mx-auto w-full max-w-[90rem]">
            <p className="px-6 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55 lg:px-8">
              Trusted by UK production teams
            </p>
            <div className="relative mt-6">
              <Marquee pauseOnHover className="[--gap:3.5rem] py-2">
                {LOGOS.map((logo) => (
                  <span
                    key={logo}
                    className="select-none whitespace-nowrap font-serif text-2xl italic text-foreground/55 transition-colors hover:text-foreground"
                  >
                    {logo}
                  </span>
                ))}
              </Marquee>
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--surface-50)] to-transparent"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--surface-50)] to-transparent"
                aria-hidden
              />
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="w-full py-24 lg:py-32">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <Reveal>
              <div className="max-w-3xl">
                <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
                  What you get
                </p>
                <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl">
                  The casting director,{' '}
                  <span className="font-serif font-normal italic">the contract lawyer,</span> and
                  the accountant —{' '}
                  <span className="font-serif font-normal italic">one platform.</span>
                </h2>
              </div>
            </Reveal>

            {/* Editorial numbered list — each feature is its own row, no card grid */}
            <div className="mt-16 divide-y divide-border/60 border-y border-border/60">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 50}>
                  <div className="grid grid-cols-[auto_1fr] items-start gap-x-6 gap-y-3 py-10 sm:gap-x-10 sm:py-12 lg:grid-cols-[140px_1fr_auto] lg:gap-x-16">
                    <span className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="max-w-2xl">
                      <h3 className="text-2xl font-medium tracking-[-0.01em] text-foreground sm:text-3xl">
                        {f.title}
                      </h3>
                      <p className="mt-3 text-base leading-relaxed text-foreground/70">
                        {f.body}
                      </p>
                    </div>
                    <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary lg:inline-flex">
                      <f.icon className="h-5 w-5" aria-hidden />
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="w-full bg-[var(--surface-50)] py-24 lg:py-32">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <Reveal>
              <div className="max-w-3xl">
                <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
                  vs. traditional casting
                </p>
                <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl">
                  Faster, safer, and{' '}
                  <span className="font-serif font-normal italic">a fraction of the cost.</span>
                </h2>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="mt-16 overflow-hidden rounded-2xl border border-border/60 bg-background">
                {/* Column header — hidden on mobile where rows self-label */}
                <div className="hidden grid-cols-[1.4fr_1fr_1fr] items-center gap-4 bg-[var(--surface-50)] px-6 py-5 sm:grid">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
                    Metric
                  </span>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
                    Traditional agency
                  </span>
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                    CastFlow
                  </span>
                </div>
                <div className="divide-y divide-border/60">
                  {COMPARISON.map((row) => (
                    <div
                      key={row.label}
                      className="px-5 py-5 sm:grid sm:grid-cols-[1.4fr_1fr_1fr] sm:items-center sm:gap-4 sm:px-6 sm:py-4"
                    >
                      <span className="text-sm font-medium text-foreground">
                        {row.label}
                      </span>
                      <span className="mt-3 flex items-baseline justify-between gap-4 sm:mt-0 sm:block">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55 sm:hidden">
                          Agency
                        </span>
                        <span className="text-sm text-foreground/60">{row.agency}</span>
                      </span>
                      <span className="mt-1.5 flex items-baseline justify-between gap-4 sm:mt-0 sm:block">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary sm:hidden">
                          CastFlow
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {row.castflow}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Testimonial */}
        <section className="w-full py-24 lg:py-32">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <Reveal>
              <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-7">
                  <div className="flex items-center gap-1 text-primary">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" aria-hidden />
                    ))}
                  </div>
                  <blockquote className="mt-6 text-balance font-serif text-3xl leading-[1.2] text-foreground sm:text-4xl">
                    &ldquo;We used to spend a week briefing agencies. With CastFlow we posted a
                    shoot at 4pm, had 18 bids by morning, and booked our talent before lunch. The
                    escrow flow alone saved us three rounds of finance emails.&rdquo;
                  </blockquote>
                  <div className="mt-8 flex items-center gap-4">
                    <Image
                      src="https://picsum.photos/seed/quote-1/80/80"
                      alt=""
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">Elena Walsh</p>
                      <p className="text-sm text-foreground/60">Head of Production · Studio West</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 lg:col-span-5">
                  <Stat label="Time saved per shoot" value="11 hrs" />
                  <Stat label="Bookings via CastFlow" value="47" />
                  <Stat label="Casting director fees" value="£0" />
                  <Stat label="Avg artist rating" value="4.9" />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full pb-28 lg:pb-36">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <Reveal>
              <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-foreground px-10 py-20 text-center text-background lg:px-16">
                <Lock
                  className="absolute -right-10 -top-10 h-48 w-48 text-background/[0.04]"
                  aria-hidden
                />
                <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-background/60">
                  Start casting
                </p>
                <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
                  Your next shoot is{' '}
                  <span className="font-serif font-normal italic">a brief away.</span>
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-background/70">
                  14-day free trial on every plan. No card to browse talent.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                  <ShimmerButtonLink
                    href="/register?role=caster"
                    background="rgba(255,255,255,1)"
                    shimmerColor="#000000"
                    className="text-foreground"
                  >
                    Post your first shoot
                    <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                  </ShimmerButtonLink>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
                  >
                    <Link href="/contact">Talk to sales</Link>
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background p-6">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
        {label}
      </p>
      <p className="mt-3 font-mono text-4xl font-medium tracking-[-0.03em] text-foreground">
        {value}
      </p>
    </div>
  )
}
