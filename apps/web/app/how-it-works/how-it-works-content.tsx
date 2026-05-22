// Page-level shell renders server-side; the only client island left is the
// AnimatedBeam visualisation, extracted into ./flow-beam-section.tsx. Every
// other animation component imported below is a client component that
// works fine when composed from a server parent.

import Link from 'next/link'
import {
  ArrowRight,
  FileText,
  Handshake,
  ShieldCheck,
  Star,
  Calendar,
  Wallet,
  MessageSquare,
  Users,
  Sparkles,
} from 'lucide-react'
import { Reveal } from '@/components/landing/reveal'
import { Button } from '@/components/ui/button'
import { NumberTicker } from '@/components/ui/number-ticker'
import { AnimatedList } from '@/components/ui/animated-list'
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern'
import { cn } from '@/lib/utils'
import { FlowBeamSection } from './flow-beam-section'

interface FeatureDef {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  title: string
  body: string
  area: string
}

const FEATURES: FeatureDef[] = [
  {
    icon: ShieldCheck,
    title: 'Verified talent only',
    body: 'Every artist is ID-checked, 18+, and admin-approved before they can bid.',
    area: 'lg:col-span-2',
  },
  {
    icon: Wallet,
    title: 'Stripe escrow built-in',
    body: 'Caster funds are ring-fenced until the shoot is confirmed.',
    area: 'lg:col-span-1',
  },
  {
    icon: Star,
    title: 'Two-way reviews',
    body: 'Both sides rate every booking. Reputation compounds.',
    area: 'lg:col-span-1',
  },
  {
    icon: Calendar,
    title: 'Auto-release at +48h',
    body: 'Payouts never get stuck — release happens whether or not the caster confirms.',
    area: 'lg:col-span-2',
  },
]

interface ActivityItem {
  id: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  who: string
  what: string
  when: string
  accent: 'primary' | 'green' | 'amber'
}

const ACTIVITY: ActivityItem[] = [
  {
    id: 'a1',
    icon: FileText,
    who: 'Hudson & Co.',
    what: 'posted a 1-day commercial in London',
    when: '2m ago',
    accent: 'primary',
  },
  {
    id: 'a2',
    icon: Handshake,
    who: 'Maya O.',
    what: 'was booked for an editorial shoot',
    when: '4m ago',
    accent: 'green',
  },
  {
    id: 'a3',
    icon: MessageSquare,
    who: 'Studio West',
    what: 'shortlisted 3 artists',
    when: '6m ago',
    accent: 'primary',
  },
  {
    id: 'a4',
    icon: Wallet,
    who: 'Daniel R.',
    what: 'received a £680 payout',
    when: '9m ago',
    accent: 'green',
  },
  {
    id: 'a5',
    icon: Star,
    who: 'Iris C.',
    what: 'received a 5-star review',
    when: '12m ago',
    accent: 'amber',
  },
  {
    id: 'a6',
    icon: Users,
    who: 'Northshore Films',
    what: 'invited 5 artists to apply',
    when: '15m ago',
    accent: 'primary',
  },
]

export function HowItWorksContent() {
  return (
    <>
      <HeroSection />
      <StatsStripSection />
      <FlowBeamSection />
      <BentoFeaturesSection />
      <LiveActivitySection />
      <FinalCtaSection />
    </>
  )
}

function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden pb-20 pt-20 lg:pb-28 lg:pt-28">
      <AnimatedGridPattern
        numSquares={28}
        maxOpacity={0.18}
        duration={3}
        repeatDelay={1}
        className={cn(
          '[mask-image:radial-gradient(720px_circle_at_center,white,transparent)]',
          'inset-x-0 inset-y-[-30%] h-[160%] skew-y-12'
        )}
      />
      <div className="relative mx-auto w-full max-w-[90rem] px-6 lg:px-8">
        <Reveal>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-primary">
            How it works
          </p>
          <h1 className="mt-6 max-w-4xl text-balance text-5xl font-medium leading-[1.04] tracking-[-0.02em] text-foreground sm:text-6xl lg:text-7xl">
            From brief to <span className="font-serif font-normal italic">paid out,</span> in four
            steps.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-foreground/75">
            Post the shoot. Receive bids from verified UK artists. Book in one click. Pay through
            escrow. No agents, no chasing invoices, no payment disputes.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/register?role=caster">
                Post a shoot
                <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link href="/talent">Browse talent</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function StatsStripSection() {
  const STATS: Array<{
    eyebrow: string
    value: number
    prefix?: string
    suffix?: string
    label: string
    decimals?: number
  }> = [
    {
      eyebrow: 'Speed',
      value: 3,
      suffix: 'd',
      label: 'Average time from post to confirmed booking',
    },
    {
      eyebrow: 'Protection',
      value: 100,
      suffix: '%',
      label: 'Of bookings paid through Stripe escrow',
    },
    {
      eyebrow: 'Talent',
      value: 27,
      suffix: 'k+',
      label: 'Verified UK artists on the platform',
    },
    {
      eyebrow: 'Quality',
      value: 4.8,
      suffix: '/5',
      label: 'Average rating across artists and casters',
      decimals: 1,
    },
  ]
  return (
    <section className="border-y border-border/60 bg-[var(--surface-50)]">
      <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
        <Reveal>
          <div className="grid grid-cols-2 divide-border/60 lg:grid-cols-4 lg:divide-x">
            {STATS.map((s, i) => (
              <div
                key={s.eyebrow}
                className={cn(
                  'flex flex-col gap-3 px-2 py-12 lg:px-10 lg:py-16',
                  i < 2 && 'border-b border-border/60 lg:border-b-0'
                )}
              >
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
                  {s.eyebrow}
                </p>
                <p className="flex items-baseline gap-0.5 font-medium leading-none tracking-[-0.04em] text-foreground">
                  {s.prefix && (
                    <span className="text-2xl text-foreground/60 sm:text-3xl">{s.prefix}</span>
                  )}
                  <NumberTicker
                    value={s.value}
                    decimalPlaces={s.decimals ?? 0}
                    className="text-5xl text-foreground sm:text-6xl lg:text-[5.25rem]"
                  />
                  {s.suffix && (
                    <span className="text-2xl text-foreground/60 sm:text-3xl lg:text-4xl">
                      {s.suffix}
                    </span>
                  )}
                </p>
                <p className="max-w-[18rem] text-sm leading-snug text-foreground/70">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function BentoFeaturesSection() {
  return (
    <section className="relative w-full overflow-hidden bg-[var(--surface-50)] py-24 lg:py-32">
      <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
        <Reveal>
          <div className="max-w-3xl">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-primary">
              Built into every step
            </p>
            <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl">
              The platform{' '}
              <span className="font-serif font-normal italic">does the boring parts</span> for you.
            </h2>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-16 grid auto-rows-[18rem] grid-cols-1 gap-4 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={cn(
                  'group relative overflow-hidden rounded-2xl border border-border/60 bg-background p-8 transition-all hover:shadow-md',
                  f.area
                )}
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                  <f.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-6 text-xl font-medium tracking-[-0.015em] text-foreground">
                  {f.title}
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-foreground/70">{f.body}</p>
                <Sparkles
                  className="absolute -right-6 -bottom-6 h-32 w-32 text-foreground/[0.04] transition-transform duration-500 group-hover:rotate-12"
                  aria-hidden
                />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const accent = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-emerald-500/10 text-emerald-600',
    amber: 'bg-amber-500/10 text-amber-600',
  }[item.accent]

  return (
    <div className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-background p-4 shadow-sm">
      <span
        className={cn(
          'inline-flex h-10 w-10 flex-none items-center justify-center rounded-full',
          accent
        )}
      >
        <item.icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="flex-1 text-sm">
        <p className="leading-tight text-foreground">
          <span className="font-medium">{item.who}</span>{' '}
          <span className="text-foreground/70">{item.what}</span>
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/50">
          {item.when}
        </p>
      </div>
    </div>
  )
}

function LiveActivitySection() {
  return (
    <section className="w-full py-24 lg:py-32">
      <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <Reveal>
            <div>
              <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-primary">
                Live activity
              </p>
              <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl">
                Bookings happen <span className="font-serif font-normal italic">every minute.</span>
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-foreground/75">
                A glimpse of what flows through CastFlow on a normal weekday — jobs posted, bids
                placed, shoots booked, payouts released.
              </p>
              <Button asChild className="mt-8 rounded-full">
                <Link href="/register?role=caster">
                  Start your first post
                  <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="relative flex h-[28rem] w-full items-end justify-center overflow-hidden rounded-2xl border border-border/60 bg-[var(--surface-50)] p-6">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-[var(--surface-50)] to-transparent"
                aria-hidden
              />
              <AnimatedList delay={1600} className="w-full max-w-md">
                {ACTIVITY.map((item) => (
                  <ActivityRow key={item.id} item={item} />
                ))}
              </AnimatedList>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function FinalCtaSection() {
  return (
    <section className="w-full pb-28 lg:pb-36">
      <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-foreground px-10 py-20 text-center text-background lg:px-16">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-background/60">
              Start now
            </p>
            <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
              Your next shoot is{' '}
              <span className="font-serif font-normal italic">four steps away.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-background/70">
              No setup fees. No card needed to browse. Free 14-day trial on every caster plan.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-background text-foreground hover:bg-background/90"
              >
                <Link href="/register?role=caster">
                  Post a shoot
                  <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
              >
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
