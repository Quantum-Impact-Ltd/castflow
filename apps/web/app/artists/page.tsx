import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  CalendarCheck,
  Coins,
  Globe2,
  IdCard,
  MessageSquare,
  Shield,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react'
import { Nav } from '@/components/landing/nav'
import { Footer } from '@/components/landing/footer'
import { Reveal } from '@/components/landing/reveal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { OrbitingCircles } from '@/components/ui/orbiting-circles'
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text'
import { NumberTicker } from '@/components/ui/number-ticker'
import { MOCK_ARTISTS } from '@/lib/mock/artists'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'For artists — CastFlow',
  description:
    'Get cast by verified UK casters and brands. Keep 100% of every agreed rate. Escrow on every booking. Bookings come to you.',
}

const REASONS = [
  {
    icon: Coins,
    title: 'Keep 100% of every booking',
    body: "We don't charge artists. Casters pay the platform — you take home the full agreed rate.",
  },
  {
    icon: Wallet,
    title: 'Escrow on every shoot',
    body: 'Caster funds are captured into Stripe escrow at booking. You shoot, then funds release. No more chasing invoices.',
  },
  {
    icon: BadgeCheck,
    title: 'Verified clients only',
    body: 'Every caster has a real company on file and pays into escrow before you shoot. No shadow producers, no off-platform deals.',
  },
  {
    icon: Star,
    title: 'Reputation that compounds',
    body: 'Every completed shoot adds a star rating, response-rate stat, and review. Better numbers, better briefs.',
  },
]

const STEPS = [
  {
    n: '01',
    icon: IdCard,
    title: 'Apply with ID',
    body: 'Six-step application: personal info, stats, portfolio, government-issued ID, experience. Takes 15 minutes.',
  },
  {
    n: '02',
    icon: Shield,
    title: 'Get verified',
    body: 'A human admin cross-checks your ID against your profile. 24–48 hour turnaround. No bots, no AI face-checks.',
  },
  {
    n: '03',
    icon: MessageSquare,
    title: 'Bid on shoots',
    body: 'Browse the live feed, pick the briefs that fit, submit a bid with your rate. Shortlisting unlocks direct messaging.',
  },
  {
    n: '04',
    icon: CalendarCheck,
    title: 'Get booked & paid',
    body: 'Sign the contract, do the shoot, get the payout. Typical: 2–3 business days into your UK bank.',
  },
]

const FAQS = [
  {
    q: 'Do I pay anything to join?',
    a: "No. CastFlow is free for artists — no listing fees, no subscriptions, no commission on your earnings. You keep 100% of every agreed rate. Casters pay the platform; you don't.",
  },
  {
    q: 'Who is allowed to apply?',
    a: 'Any UK-based model or actor aged 18+. We hard-block under-18 sign-ups at registration. Approval is required before you can bid — typically within 24–48 hours of submission.',
  },
  {
    q: 'How do payouts work?',
    a: "When you're booked, the caster's payment goes into Stripe escrow. Once the shoot is confirmed complete (or auto-release fires at +48 hours), Stripe pays you directly to your connected UK bank — usually 2–3 business days.",
  },
  {
    q: "What if a caster doesn't pay?",
    a: "They can't book you without putting funds into escrow first. If they go silent after the shoot, escrow auto-releases 48 hours after the shoot date. You always get paid.",
  },
  {
    q: 'Can I keep my agent?',
    a: 'Yes. CastFlow is direct-to-talent, but if you have an agent representing you, you can list their contact under your profile settings. The agreed rate still pays out to your bank — your arrangement with your agent is between you two.',
  },
]

export default function ArtistsPage() {
  const preview = Object.values(MOCK_ARTISTS).slice(0, 3)

  return (
    <>
      <Nav />
      <main className="bg-background">
        {/* Hero */}
        <section className="relative w-full overflow-hidden pb-16 pt-20 lg:pb-24 lg:pt-28">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <div className="grid items-center gap-16 lg:grid-cols-12 lg:gap-12">
              <Reveal className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-[var(--surface-50)] px-4 py-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                  <AnimatedShinyText
                    shimmerWidth={120}
                    className="font-mono text-[11px] font-medium uppercase tracking-[0.18em]"
                  >
                    For models and actors
                  </AnimatedShinyText>
                </div>

                <h1 className="mt-8 text-balance text-5xl font-medium leading-[1.04] tracking-[-0.02em] text-foreground sm:text-6xl lg:text-7xl">
                  Get booked. <span className="font-serif font-normal italic">Get paid.</span> Keep
                  100%.
                </h1>
                <p className="mt-8 max-w-xl text-lg leading-relaxed text-foreground/75">
                  Verified UK casters post shoots. You bid the rate that works. Every booking is
                  escrow-paid before the shoot — so you never chase an invoice again.
                </p>

                <div className="mt-10 flex flex-wrap items-center gap-3">
                  <Button asChild size="lg" className="rounded-full">
                    <Link href="/register?role=artist">
                      Apply to join
                      <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full">
                    <Link href="/how-it-works">See how it works</Link>
                  </Button>
                </div>

                <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-foreground/70">
                  <Tagline icon={Shield}>18+ only · ID-verified</Tagline>
                  <Tagline icon={Wallet}>No platform fee</Tagline>
                  <Tagline icon={Globe2}>UK-wide briefs</Tagline>
                </div>
              </Reveal>

              <Reveal delay={120} className="lg:col-span-5">
                <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-border/60 bg-[var(--surface-50)] p-8 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
                      This month
                    </p>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Paid out
                    </span>
                  </div>
                  <p className="mt-6 font-mono text-6xl font-medium tracking-[-0.04em] text-foreground">
                    £
                    <NumberTicker value={4280} className="text-foreground" />
                  </p>
                  <p className="mt-2 text-sm text-foreground/70">Net to bank · 4 bookings</p>

                  <div className="mt-8 space-y-3 border-t border-border/60 pt-6">
                    <PayoutLine label="Editorial · House of Linen" amount="£1,200" />
                    <PayoutLine label="Commercial · Studio West" amount="£1,580" />
                    <PayoutLine label="Lookbook · Atelier 14" amount="£900" />
                    <PayoutLine label="E-com · Wave / Brand" amount="£600" />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <section className="border-y border-border/60 bg-[var(--surface-50)]">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <div className="grid grid-cols-2 divide-border/60 lg:grid-cols-4 lg:divide-x">
              <StatTile eyebrow="Take-home" value={100} suffix="%" label="Of every agreed rate" />
              <StatTile
                eyebrow="Protection"
                value={100}
                suffix="%"
                label="Of bookings escrow-secured"
                lastMobileBorder
              />
              <StatTile
                eyebrow="Time to payout"
                value={3}
                suffix="d"
                label="Typical Stripe transfer to UK bank"
              />
              <StatTile
                eyebrow="Avg rating"
                value={4.8}
                suffix="/5"
                decimals={1}
                label="Across all verified artists"
              />
            </div>
          </div>
        </section>

        {/* Why CastFlow */}
        <section className="w-full py-24 lg:py-32">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <Reveal>
              <div className="max-w-3xl">
                <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-primary">
                  Why CastFlow
                </p>
                <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl">
                  Built for the people{' '}
                  <span className="font-serif font-normal italic">actually doing the work.</span>
                </h2>
              </div>
            </Reveal>

            <div className="mt-16 grid gap-4 md:grid-cols-2">
              {REASONS.map((r, i) => (
                <Reveal key={r.title} delay={i * 80}>
                  <div className="group flex h-full gap-5 rounded-2xl border border-border/60 bg-background p-8 transition-all hover:shadow-md">
                    <span className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                      <r.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-xl font-medium tracking-[-0.015em] text-foreground">
                        {r.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/70">{r.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Verified by humans — OrbitingCircles centerpiece */}
        <section className="w-full overflow-hidden bg-[var(--surface-50)] py-24 lg:py-32">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
              <Reveal>
                <div>
                  <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-primary">
                    Verified by humans
                  </p>
                  <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl">
                    The badge you earn{' '}
                    <span className="font-serif font-normal italic">opens better briefs.</span>
                  </h2>
                  <p className="mt-6 max-w-md text-base leading-relaxed text-foreground/75">
                    Every approved artist is hand-reviewed: ID document cross-checked, age verified,
                    profile cleared by a person on our team. The badge isn&apos;t cosmetic —
                    it&apos;s the filter casters use first.
                  </p>
                  <ul className="mt-8 space-y-3">
                    <Check>Government ID matched to profile name</Check>
                    <Check>Hard 18+ block at registration</Check>
                    <Check>One account per person — no duplicates</Check>
                    <Check>Approval status visible to every caster</Check>
                  </ul>
                </div>
              </Reveal>

              <Reveal delay={120}>
                <div className="relative mx-auto aspect-square w-full max-w-[420px]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full bg-foreground text-background shadow-xl">
                      <BadgeCheck className="h-12 w-12" aria-hidden />
                    </div>
                  </div>
                  <OrbitingCircles radius={120} duration={20} iconSize={44}>
                    <OrbitIcon Icon={IdCard} />
                    <OrbitIcon Icon={Shield} />
                    <OrbitIcon Icon={Camera} />
                    <OrbitIcon Icon={Star} />
                  </OrbitingCircles>
                  <OrbitingCircles radius={185} duration={28} reverse iconSize={36}>
                    <OrbitIcon Icon={Wallet} subtle />
                    <OrbitIcon Icon={MessageSquare} subtle />
                    <OrbitIcon Icon={CalendarCheck} subtle />
                    <OrbitIcon Icon={Globe2} subtle />
                    <OrbitIcon Icon={Coins} subtle />
                  </OrbitingCircles>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* How to get started */}
        <section className="w-full py-24 lg:py-32">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <Reveal>
              <div className="max-w-3xl">
                <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-primary">
                  Get started
                </p>
                <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl">
                  Four steps from sign-up{' '}
                  <span className="font-serif font-normal italic">to first payout.</span>
                </h2>
              </div>
            </Reveal>

            {/* Vertical numbered timeline — sequential workflow reads as a single
                editorial flow, not a 4-up identical card grid. */}
            <ol className="mt-16 relative ml-2">
              {STEPS.map((s, i) => {
                const isLast = i === STEPS.length - 1
                return (
                  <li key={s.n} className="relative pl-12 pb-12 last:pb-0 sm:pl-16">
                    {/* Connecting rail between numbers — hairline, no flourish */}
                    {!isLast ? (
                      <span
                        aria-hidden
                        className="absolute left-[18px] top-12 h-[calc(100%-2.5rem)] w-px bg-border sm:left-[22px]"
                      />
                    ) : null}
                    <Reveal delay={i * 70}>
                      <span className="absolute left-0 top-0 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background font-mono text-xs font-semibold tracking-[0.04em] text-foreground sm:h-11 sm:w-11 sm:text-sm">
                        {s.n}
                      </span>
                      <div className="max-w-2xl">
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-medium tracking-[-0.01em] text-foreground sm:text-3xl">
                            {s.title}
                          </h3>
                          <s.icon
                            className="hidden h-5 w-5 text-foreground/40 sm:inline-block"
                            aria-hidden
                          />
                        </div>
                        <p className="mt-3 text-base leading-relaxed text-foreground/70">
                          {s.body}
                        </p>
                      </div>
                    </Reveal>
                  </li>
                )
              })}
            </ol>
          </div>
        </section>

        {/* Talent preview */}
        <section className="w-full bg-[var(--surface-50)] py-24 lg:py-32">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div className="max-w-2xl">
                  <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-primary">
                    On the platform
                  </p>
                  <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl">
                    A few of the <span className="font-serif font-normal italic">approved</span>{' '}
                    artists.
                  </h2>
                </div>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/talent">
                    Browse all talent
                    <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {preview.map((artist) => {
                  const hero =
                    artist.portfolioItems?.find((p) => p.isPrimary)?.url ??
                    artist.portfolioItems?.[0]?.url ??
                    ''
                  return (
                    <Link
                      key={artist.id}
                      href={`/artists/${artist.id}`}
                      className="group block overflow-hidden rounded-2xl border border-border/60 bg-background transition-all hover:shadow-md"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--surface-50)]">
                        {hero && (
                          <Image
                            src={hero}
                            alt={`${artist.firstName} portfolio cover`}
                            fill
                            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          />
                        )}
                        <div className="absolute left-4 top-4">
                          <Badge className="rounded-full bg-background/90 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground backdrop-blur">
                            <BadgeCheck className="mr-1 h-3 w-3 text-primary" />
                            Verified
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-5">
                        <div>
                          <p className="text-base font-medium tracking-[-0.01em] text-foreground">
                            {artist.firstName}
                          </p>
                          <p className="mt-1 text-xs text-foreground/60">
                            {artist.artistType === 'model' ? 'Model' : 'Actor'} · {artist.city}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                          <Star className="h-3.5 w-3.5 fill-primary text-primary" aria-hidden />
                          {Number(artist.ratingAvg ?? 0).toFixed(1)}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section className="w-full py-24 lg:py-32">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <Reveal className="lg:col-span-4">
                <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-primary">
                  FAQ
                </p>
                <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl">
                  Questions <span className="font-serif font-normal italic">artists ask.</span>
                </h2>
                <p className="mt-6 text-sm text-foreground/70">
                  More questions?{' '}
                  <Link
                    href="/contact"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Talk to us
                  </Link>
                  .
                </p>
              </Reveal>

              <Reveal delay={120} className="lg:col-span-8">
                <ul className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-background">
                  {FAQS.map((faq) => (
                    <li key={faq.q}>
                      <details className="group">
                        <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-base font-medium text-foreground transition-colors hover:bg-[var(--surface-50)]/60 [&::-webkit-details-marker]:hidden">
                          <span>{faq.q}</span>
                          <span
                            aria-hidden
                            className="font-mono text-xl text-foreground/40 transition-transform duration-200 group-open:rotate-45"
                          >
                            +
                          </span>
                        </summary>
                        <div className="px-6 pb-6 text-sm leading-relaxed text-foreground/75">
                          {faq.a}
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full pb-28 lg:pb-36">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <Reveal>
              <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-foreground px-10 py-20 text-center text-background lg:px-16">
                <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-background/60">
                  Join the platform
                </p>
                <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
                  Your next booking is{' '}
                  <span className="font-serif font-normal italic">one application away.</span>
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-background/70">
                  Free forever for artists. Apply in 15 minutes — we review every application within
                  48 hours.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full bg-background text-foreground hover:bg-background/90"
                  >
                    <Link href="/register?role=artist">
                      Apply to join
                      <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
                  >
                    <Link href="/how-it-works">How it works</Link>
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

function Tagline({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
      <span className="font-medium">{children}</span>
    </span>
  )
}

function PayoutLine({ label, amount }: { label: string; amount: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground/70">{label}</span>
      <span className="font-mono font-medium text-foreground">{amount}</span>
    </div>
  )
}

function StatTile({
  eyebrow,
  value,
  suffix,
  label,
  decimals,
  lastMobileBorder,
}: {
  eyebrow: string
  value: number
  suffix?: string
  label: string
  decimals?: number
  lastMobileBorder?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 px-2 py-12 lg:px-10 lg:py-16',
        !lastMobileBorder && 'border-b border-border/60 lg:border-b-0',
        lastMobileBorder && 'border-b border-border/60 lg:border-b-0'
      )}
    >
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
        {eyebrow}
      </p>
      <p className="flex items-baseline gap-0.5 font-medium leading-none tracking-[-0.04em] text-foreground">
        <NumberTicker
          value={value}
          decimalPlaces={decimals ?? 0}
          className="text-5xl text-foreground sm:text-6xl lg:text-[5.25rem]"
        />
        {suffix && (
          <span className="text-2xl text-foreground/60 sm:text-3xl lg:text-4xl">{suffix}</span>
        )}
      </p>
      <p className="max-w-[18rem] text-sm leading-snug text-foreground/70">{label}</p>
    </div>
  )
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-foreground/85">
      <BadgeCheck className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden />
      {children}
    </li>
  )
}

function OrbitIcon({
  Icon,
  subtle = false,
}: {
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  subtle?: boolean
}) {
  return (
    <span
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full border border-border/60 bg-background shadow-sm',
        subtle && 'opacity-80'
      )}
    >
      <Icon className={cn('h-5 w-5', subtle ? 'text-foreground/60' : 'text-primary')} aria-hidden />
    </span>
  )
}
