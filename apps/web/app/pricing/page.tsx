import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, Minus } from 'lucide-react'
import { Nav } from '@/components/landing/nav'
import { Footer } from '@/components/landing/footer'
import { Reveal } from '@/components/landing/reveal'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Pricing — CastFlow',
  description:
    'Casters pay a monthly subscription plus a per-booking commission. Artists never pay a fee — they keep 100% of every agreed rate.',
}

interface Tier {
  slug: 'starter' | 'studio' | 'agency'
  name: string
  sub: string
  monthly: string
  commission: string
  features: string[]
  cta: string
  popular?: boolean
}

const TIERS: Tier[] = [
  {
    slug: 'starter',
    name: 'Starter',
    sub: 'Freelance producers and small brands',
    monthly: '£49',
    commission: '10% per booking',
    features: [
      '1 active job post at a time',
      '1 user seat',
      'Full talent search & filters',
      'Escrow + contracts + reviews',
      'Email support',
    ],
    cta: 'Choose Starter',
  },
  {
    slug: 'studio',
    name: 'Studio',
    sub: 'Mid-size brands and boutique agencies',
    monthly: '£149',
    commission: '8% per booking',
    features: [
      '3 active job posts',
      '3 user seats',
      'Direct invite-to-apply',
      'Saved talent lists',
      'Priority email + chat support',
    ],
    cta: 'Choose Studio',
    popular: true,
  },
  {
    slug: 'agency',
    name: 'Agency',
    sub: 'Full agencies and production houses',
    monthly: '£399',
    commission: '6% per booking',
    features: [
      'Unlimited job posts',
      '10 user seats',
      'API access (coming soon)',
      'Custom contract templates',
      'Dedicated account manager',
    ],
    cta: 'Choose Agency',
  },
]

interface ComparisonRow {
  label: string
  starter: string | boolean
  studio: string | boolean
  agency: string | boolean
}

const COMPARISON: ComparisonRow[] = [
  { label: 'Active job posts', starter: '1', studio: '3', agency: 'Unlimited' },
  { label: 'Team seats', starter: '1', studio: '3', agency: '10' },
  { label: 'Talent search', starter: true, studio: true, agency: true },
  { label: 'Escrow payments', starter: true, studio: true, agency: true },
  { label: 'Built-in contracts', starter: true, studio: true, agency: true },
  { label: 'Verified artists', starter: true, studio: true, agency: true },
  { label: 'Direct invite-to-apply', starter: false, studio: true, agency: true },
  { label: 'Saved talent lists', starter: false, studio: true, agency: true },
  { label: 'Priority support', starter: false, studio: true, agency: true },
  { label: 'Dedicated account manager', starter: false, studio: false, agency: true },
  { label: 'Custom contract templates', starter: false, studio: false, agency: true },
  { label: 'API access', starter: false, studio: false, agency: 'Coming soon' },
]

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: 'Do artists pay anything?',
    a: 'No. Artists never pay a subscription, listing fee, or platform charge. Our commission comes out of the artist payout — the caster pays the full agreed rate, and we take a small percentage at the point of release. The artist always sees the gross → commission → net breakdown up-front, so there are no surprises.',
  },
  {
    q: 'How does the commission work?',
    a: "When a booking is confirmed, the caster's full payment goes into escrow. Once the shoot is completed and confirmed (or auto-released after 48 hours), Stripe deducts the platform commission from the artist's side and transfers the net amount to their connected bank account. The commission rate depends on the caster's plan — 10%, 8%, or 6%.",
  },
  {
    q: 'When am I charged?',
    a: 'The monthly subscription is billed at sign-up and then every 30 days. The per-booking commission is only taken when a booking is paid out — never up-front, never on cancelled or refunded bookings.',
  },
  {
    q: 'Can I change plans?',
    a: 'Yes. Upgrade or downgrade any time. Upgrades take effect immediately and we pro-rate the difference. Downgrades take effect at the end of your current billing cycle.',
  },
  {
    q: 'What if a booking is cancelled?',
    a: 'If a booking is cancelled before the 48-hour mark, the caster receives a full refund and no commission is taken. Inside 48 hours, our cancellation policy applies (the cancelling party owes a 50% fee to the other side) — commission is still only taken on funds that actually transfer to the artist.',
  },
  {
    q: 'Is VAT included?',
    a: 'All prices shown are excluding VAT. UK VAT (20%) is added at checkout for UK-registered businesses. EU and international customers are charged based on their location.',
  },
  {
    q: 'Do you offer custom enterprise pricing?',
    a: 'Yes — for in-house production teams running high volumes, agency networks, or anyone needing custom contracts, SSO, or onboarding support, we have an Enterprise tier. Get in touch via the contact page for a tailored quote.',
  },
]

function TierCard({ tier }: { tier: Tier }) {
  return (
    <div
      className={cn(
        'relative flex h-full flex-col rounded-2xl border bg-background p-10 transition-all',
        tier.popular
          ? 'border-primary shadow-md lg:scale-[1.03]'
          : 'border-border hover:shadow-sm',
      )}
    >
      {tier.popular && (
        <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center rounded-full bg-primary px-3 py-1 font-mono text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground">
          Most popular
        </span>
      )}

      <div>
        <h2 className="text-2xl font-medium tracking-[-0.015em] text-foreground">
          {tier.name}
        </h2>
        <p className="mt-2 text-sm text-foreground/70">{tier.sub}</p>
      </div>

      <div className="mt-8">
        <p className="flex items-baseline gap-1">
          <span className="text-5xl font-medium tracking-[-0.03em] text-foreground">
            {tier.monthly}
          </span>
          <span className="text-sm text-foreground/60">/ month</span>
        </p>
        <p className="mt-2 text-sm text-foreground/70">+ {tier.commission}</p>
      </div>

      <ul className="mt-8 flex flex-1 flex-col gap-3 border-t border-border/60 pt-6">
        {tier.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-sm text-foreground"
          >
            <Check
              className="mt-0.5 h-4 w-4 flex-none text-primary"
              aria-hidden
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        asChild
        className="mt-10 h-11 w-full rounded-full"
        variant={tier.popular ? 'default' : 'outline'}
      >
        <Link href={`/register?role=caster&plan=${tier.slug}`}>{tier.cta}</Link>
      </Button>
    </div>
  )
}

function YesNo({ value }: { value: string | boolean }) {
  if (value === true)
    return (
      <span className="inline-flex">
        <Check className="h-4 w-4 text-primary" aria-hidden />
        <span className="sr-only">Included</span>
      </span>
    )
  if (value === false)
    return (
      <span className="inline-flex">
        <Minus className="h-4 w-4 text-foreground/30" aria-hidden />
        <span className="sr-only">Not included</span>
      </span>
    )
  return <span className="text-sm font-medium text-foreground">{value}</span>
}

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main className="bg-background">
        {/* Hero */}
        <section className="w-full pb-16 pt-20 lg:pb-24 lg:pt-28">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <Reveal>
              <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
                Pricing
              </p>
              <h1 className="mt-6 max-w-4xl text-balance text-5xl font-medium leading-[1.04] tracking-[-0.02em] text-foreground sm:text-6xl lg:text-7xl">
                Casters pay.{' '}
                <span className="font-serif font-normal italic">Artists keep 100%.</span>
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-foreground/75">
                One monthly subscription plus a small per-booking commission. Every artist takes
                home their full agreed rate. No skim, no listing fees, no surprises.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Tiers */}
        <section className="w-full pb-24 lg:pb-32">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
              {TIERS.map((tier, i) => (
                <Reveal key={tier.slug} delay={i * 80}>
                  <TierCard tier={tier} />
                </Reveal>
              ))}
            </div>

            <Reveal delay={240}>
              <p className="mt-10 text-center text-sm text-foreground/70">
                All prices excluding VAT. Annual billing saves 15% — applied at checkout.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Commission breakdown visualisation */}
        <section className="w-full bg-[var(--surface-50)] py-24 lg:py-32">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <Reveal>
              <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
                <div className="lg:col-span-5">
                  <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
                    How payouts work
                  </p>
                  <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl">
                    The artist sees{' '}
                    every penny before they
                    bid.
                  </h2>
                </div>
                <p className="text-lg leading-relaxed text-foreground/75 lg:col-span-7 lg:pt-2">
                  Caster pays the agreed rate into escrow. When the shoot is confirmed complete,
                  Stripe deducts our commission from the artist&apos;s side and transfers the net
                  into their UK bank account — typically 2–3 business days.
                </p>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-3">
                <BreakdownCard
                  step="1 · Caster pays"
                  label="Agreed rate"
                  prefix="£"
                  value={1000}
                  note="Captured into escrow at booking confirmation."
                />
                <BreakdownCard
                  step="2 · Platform commission"
                  label="At payout (Studio plan, 8%)"
                  prefix="−£"
                  value={80}
                  amountClassName="text-foreground/70"
                  note="Deducted from artist's side — never added to the caster's bill."
                />
                <BreakdownCard
                  step="3 · Artist takes home"
                  label="Net to bank"
                  prefix="£"
                  value={920}
                  highlight
                  note="Released after shoot confirmation. Auto-released after 48h."
                />
              </div>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-foreground/70">
                <SmallNote>No listing fees</SmallNote>
                <SmallNote>No payout fees</SmallNote>
                <SmallNote>No platform charge to artists</SmallNote>
                <SmallNote>Commission only on completed bookings</SmallNote>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Feature comparison table */}
        <section className="w-full py-24 lg:py-32">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <Reveal>
              <div className="max-w-3xl">
                <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
                  Compare plans
                </p>
                <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl">
                  Pick the plan that{' '}
                  matches your volume.
                </h2>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="mt-12 overflow-hidden rounded-2xl border border-border/60">
                <div className="grid grid-cols-[1.4fr_repeat(3,minmax(0,1fr))] items-center gap-4 bg-[var(--surface-50)] px-6 py-5">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/60">
                    Feature
                  </span>
                  {(['Starter', 'Studio', 'Agency'] as const).map((name) => (
                    <span
                      key={name}
                      className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/60"
                    >
                      {name}
                    </span>
                  ))}
                </div>
                <div className="divide-y divide-border/60">
                  {COMPARISON.map((row) => (
                    <div
                      key={row.label}
                      className="grid grid-cols-[1.4fr_repeat(3,minmax(0,1fr))] items-center gap-4 px-6 py-4 transition-colors hover:bg-[var(--surface-50)]/60"
                    >
                      <span className="text-sm font-medium text-foreground">{row.label}</span>
                      <YesNo value={row.starter} />
                      <YesNo value={row.studio} />
                      <YesNo value={row.agency} />
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section className="w-full bg-[var(--surface-50)] py-24 lg:py-32">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <Reveal className="lg:col-span-4">
                <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
                  FAQ
                </p>
                <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl">
                  Common questions.
                </h2>
                <p className="mt-6 text-sm text-foreground/70">
                  Still unsure?{' '}
                  <Link
                    href="/contact"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Get in touch
                  </Link>
                  .
                </p>
              </Reveal>

              <Reveal delay={120} className="lg:col-span-8">
                <ul className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-background">
                  {FAQS.map((faq) => (
                    <li key={faq.q}>
                      <details className="group transition-colors open:bg-[var(--surface-50)]/40">
                        <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-base font-medium text-foreground transition-colors hover:bg-[var(--surface-50)]/60 [&::-webkit-details-marker]:hidden">
                          <span>{faq.q}</span>
                          <span
                            aria-hidden
                            className="font-mono text-xl text-foreground/40 transition-transform duration-200 group-open:rotate-45 group-open:text-foreground/70"
                          >
                            +
                          </span>
                        </summary>
                        {/* Hairline divider only appears when the panel is open,
                            so the closed list reads as a clean column of rows. */}
                        <div className="border-t border-border/40 px-6 py-5 text-sm leading-relaxed text-foreground/75">
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
        <section className="w-full py-28 lg:py-36">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <Reveal>
              <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-foreground px-10 py-20 text-center text-background lg:px-16">
                <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-background/60">
                  Start casting
                </p>
                <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
                  Post your first job{' '}
                  in minutes.
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-background/70">
                  Free 14-day trial on every plan. No credit card needed to browse talent.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full bg-background text-foreground hover:bg-background/90"
                  >
                    <Link href="/register?role=caster">
                      Get started
                      <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
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

function BreakdownCard({
  step,
  label,
  prefix,
  value,
  note,
  highlight = false,
  amountClassName,
}: {
  step: string
  label: string
  prefix: string
  value: number
  note: string
  highlight?: boolean
  amountClassName?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border bg-background p-8 transition-all',
        highlight ? 'border-primary shadow-md' : 'border-border/60 hover:shadow-sm'
      )}
    >
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/60">
        {step}
      </p>
      <p className="mt-3 text-sm text-foreground/70">{label}</p>
      <p
        className={cn(
          'mt-4 inline-flex items-baseline text-5xl font-medium tracking-[-0.03em]',
          highlight ? 'text-primary' : 'text-foreground',
          amountClassName
        )}
      >
        <span>{prefix}</span>
        <span className={cn(highlight ? 'text-primary' : 'text-foreground', amountClassName)}>
          {value}
        </span>
      </p>
      <p className="mt-4 text-sm leading-relaxed text-foreground/70">{note}</p>
    </div>
  )
}

function SmallNote({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
      <span className="font-medium">{children}</span>
    </span>
  )
}
