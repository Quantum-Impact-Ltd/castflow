'use client'

import { useRef } from 'react'
import { Lock, Camera, Unlock, Banknote } from 'lucide-react'
import { Reveal } from '@/components/landing/reveal'
import { AnimatedBeam } from '@/components/ui/animated-beam'

interface FlowStep {
  step: string
  title: string
  body: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
}

const ESCROW_FLOW: FlowStep[] = [
  {
    step: '01',
    title: 'Booking confirmed',
    icon: Lock,
    body: "Caster's full payment is captured into Stripe escrow. Neither party can touch the funds.",
  },
  {
    step: '02',
    title: 'Shoot happens',
    icon: Camera,
    body: 'Money stays frozen. Both parties focus on the job, not the payment.',
  },
  {
    step: '03',
    title: 'Confirmation or auto-release',
    icon: Unlock,
    body: 'Caster confirms completion. If they go silent, escrow auto-releases 48 hours after the shoot date.',
  },
  {
    step: '04',
    title: 'Payout',
    icon: Banknote,
    body: 'Stripe deducts the platform commission from the artist side and pays out to their UK bank — typically 2–3 business days.',
  },
]

export function EscrowFlowSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const n0 = useRef<HTMLDivElement>(null)
  const n1 = useRef<HTMLDivElement>(null)
  const n2 = useRef<HTMLDivElement>(null)
  const n3 = useRef<HTMLDivElement>(null)
  const nodes = [n0, n1, n2, n3] as const

  return (
    <section className="w-full py-24 lg:py-32">
      <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
        <Reveal>
          <div className="max-w-3xl">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-primary">
              How escrow works
            </p>
            <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl">
              Money moves only when{' '}
              <span className="font-serif font-normal italic">
                the shoot does.
              </span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-foreground/75">
              Stripe holds the caster&apos;s payment from booking confirmation
              through shoot completion. Auto-release at +48 hours stops payouts
              from getting stuck if a caster goes quiet.
            </p>
          </div>
        </Reveal>

        {/* Icon node row with AnimatedBeams — lg+ only */}
        <Reveal delay={100}>
          <div
            ref={containerRef}
            className="relative mt-20 hidden lg:block"
            aria-hidden
          >
            <div className="relative flex items-center justify-between gap-6">
              {ESCROW_FLOW.map((s, i) => (
                <div
                  key={s.step}
                  ref={nodes[i]}
                  className="z-10 flex h-20 w-20 items-center justify-center rounded-full border border-border/60 bg-background shadow-sm"
                >
                  <s.icon className="h-7 w-7 text-primary" aria-hidden />
                </div>
              ))}
            </div>

            {nodes.slice(0, -1).map((from, i) => (
              <AnimatedBeam
                key={`beam-${i}`}
                containerRef={containerRef}
                fromRef={from}
                toRef={nodes[i + 1]!}
                curvature={-30}
                duration={4}
                delay={i * 0.6}
                gradientStartColor="hsl(var(--primary))"
                gradientStopColor="hsl(var(--primary))"
                pathColor="currentColor"
                pathOpacity={0.15}
              />
            ))}
          </div>
        </Reveal>

        {/* Step detail cards */}
        <Reveal delay={160}>
          <ol className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-4">
            {ESCROW_FLOW.map((step) => (
              <li
                key={step.step}
                className="relative flex flex-col rounded-2xl border border-border/60 bg-background p-8"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-3xl font-medium tracking-[-0.02em] text-primary">
                    {step.step}
                  </span>
                  <step.icon
                    className="h-5 w-5 text-foreground/40 lg:hidden"
                    aria-hidden
                  />
                </div>
                <h3 className="mt-4 text-lg font-medium tracking-[-0.015em] text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  )
}
