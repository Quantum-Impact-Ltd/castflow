import Link from 'next/link'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { BorderBeam } from '@/components/ui/border-beam'
import { Reveal } from '../reveal'

interface Tier {
  slug: string
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
    monthly: '£XX',
    commission: 'X% per booking',
    features: [
      '1 active job post',
      '1 seat',
      'Full talent search',
      'Escrow + contracts',
    ],
    cta: 'Choose Starter',
  },
  {
    slug: 'studio',
    name: 'Studio',
    sub: 'Mid-size brands and boutique agencies',
    monthly: '£XX',
    commission: 'X% per booking',
    features: [
      '3 active job posts',
      '3 seats',
      'Direct invite to apply',
      'Priority support',
    ],
    cta: 'Choose Studio',
    popular: true,
  },
  {
    slug: 'agency',
    name: 'Agency',
    sub: 'Full agencies and production houses',
    monthly: '£XX',
    commission: 'X% per booking',
    features: [
      'Unlimited job posts',
      '10 seats',
      'API access (coming soon)',
      'Dedicated account manager',
    ],
    cta: 'Choose Agency',
  },
]

export function PricingPreviewSection() {
  return (
    <section className="w-full bg-background py-24 lg:py-36">
      <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
        <Reveal>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-primary">
                Pricing
              </p>
              <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl lg:text-6xl">
                Casters pay.{' '}
                <span className="font-serif font-normal italic">
                  Artists never do.
                </span>
              </h2>
            </div>
            <p className="text-lg leading-relaxed text-muted-foreground lg:col-span-5 lg:pt-2">
              One monthly subscription plus a small per-casting commission. Every
              artist keeps 100% of their agreed rate. No surprise deductions, no
              hidden fees, no platform skim from the talent side.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {TIERS.map((tier, i) => (
            <Reveal key={tier.slug} delay={i * 80}>
              <div
                className={cn(
                  'relative flex h-full flex-col rounded-2xl border bg-background p-10 transition-all',
                  tier.popular
                    ? 'border-primary shadow-md lg:scale-[1.03]'
                    : 'border-border hover:shadow-sm',
                )}
              >
                {tier.popular ? (
                  <>
                    <BorderBeam
                      size={20}
                      duration={9}
                      colorFrom="#85bcda"
                      colorTo="#2a6b96"
                      borderWidth={2}
                    />
                    <BorderBeam
                      size={20}
                      duration={9}
                      delay={4.5}
                      colorFrom="#85bcda"
                      colorTo="#2a6b96"
                      borderWidth={2}
                    />
                    <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center rounded-full bg-primary px-3 py-1 font-mono text-xs font-medium uppercase tracking-[0.18em] text-primary-foreground">
                      Most popular
                    </span>
                  </>
                ) : null}

                <div>
                  <h3 className="text-2xl font-medium tracking-[-0.015em] text-foreground">
                    {tier.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {tier.sub}
                  </p>
                </div>

                <div className="mt-8">
                  <p className="flex items-baseline gap-1">
                    <span className="font-mono text-5xl font-medium tracking-[-0.03em] text-foreground">
                      {tier.monthly}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / month
                    </span>
                  </p>
                  <p className="mt-2 font-mono text-sm text-muted-foreground">
                    + {tier.commission}
                  </p>
                </div>

                <ul className="mt-8 flex flex-col gap-3 border-t border-border/60 pt-6">
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
                  <Link href={`/register?role=caster&plan=${tier.slug}`}>
                    {tier.cta}
                  </Link>
                </Button>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={240}>
          <p className="mt-12 text-center text-sm text-muted-foreground">
            Artists keep 100% of every booking, no platform fee, ever.{' '}
            <Link
              href="/pricing"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              See full pricing →
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
