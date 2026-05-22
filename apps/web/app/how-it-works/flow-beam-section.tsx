'use client'

import { Fragment, useRef } from 'react'
import { ChevronDown, FileText, Gavel, Handshake, Wallet } from 'lucide-react'
import { Reveal } from '@/components/landing/reveal'
import { AnimatedBeam } from '@/components/ui/animated-beam'

interface StepDef {
  num: string
  title: string
  body: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  details: string[]
}

const STEPS: StepDef[] = [
  {
    num: '01',
    title: 'Post the shoot',
    icon: FileText,
    body: 'Casters spec the brief — date, location, usage rights, budget — in under five minutes.',
    details: [
      'Fixed-rate or open-to-bids',
      'Public or invite-only visibility',
      'Required talent type, age range, city',
    ],
  },
  {
    num: '02',
    title: 'Receive bids',
    icon: Gavel,
    body: 'Verified UK artists discover the job in their feed and submit a bid with their proposed terms.',
    details: [
      'One bid per artist (enforced at DB level)',
      'Side-by-side bid comparison',
      'Shortlist to unlock messaging',
    ],
  },
  {
    num: '03',
    title: 'Book in one click',
    icon: Handshake,
    body: 'Accept a bid and CastFlow generates the contract, locks the date, and captures the escrow.',
    details: [
      'E-signed under UK ECA 2000',
      'Shoot location revealed on sign',
      '72-hour dispute window opens',
    ],
  },
  {
    num: '04',
    title: 'Pay through escrow',
    icon: Wallet,
    body: 'Funds release when the shoot is confirmed complete, or auto-release 48 hours later. Artists keep 100% of the agreed rate.',
    details: [
      'Stripe-held escrow on every booking',
      'Auto-release at shoot date + 48h',
      'Gross → commission → net always visible',
    ],
  },
]

/**
 * Client island for the AnimatedBeam visualisation on /how-it-works. Lives
 * here (rather than in how-it-works-content.tsx) so the surrounding page
 * shell can stay a server component — the beam needs DOM refs but nothing
 * else on the page does.
 */
export function FlowBeamSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const node0Ref = useRef<HTMLDivElement>(null)
  const node1Ref = useRef<HTMLDivElement>(null)
  const node2Ref = useRef<HTMLDivElement>(null)
  const node3Ref = useRef<HTMLDivElement>(null)
  const nodeRefs = [node0Ref, node1Ref, node2Ref, node3Ref] as const

  return (
    <section className="w-full py-24 lg:py-32">
      <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
        <Reveal>
          <div className="max-w-3xl">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-primary">
              The flow
            </p>
            <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl">
              Every booking{' '}
              <span className="font-serif font-normal italic">follows the same path.</span>
            </h2>
          </div>
        </Reveal>

        {/* Beam canvas — visible on lg+ */}
        <Reveal delay={100}>
          <div ref={containerRef} className="relative mt-20 hidden lg:block" aria-hidden>
            <div className="relative flex items-center justify-between gap-6">
              {STEPS.map((step, i) => (
                <div
                  key={step.num}
                  ref={nodeRefs[i]}
                  className="z-10 flex h-20 w-20 items-center justify-center rounded-full border border-border/60 bg-background shadow-sm"
                >
                  <step.icon className="h-8 w-8 text-primary" aria-hidden />
                </div>
              ))}
            </div>

            {nodeRefs.slice(0, -1).map((fromRef, i) => (
              <AnimatedBeam
                key={`beam-${i}`}
                containerRef={containerRef}
                fromRef={fromRef}
                toRef={nodeRefs[i + 1]!}
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

        {/* Card flow — single column with chevron connectors at <lg so the
            sequential meaning carries through on mobile/tablet, then a 4-col
            grid at lg+ where the AnimatedBeam takes over the flow semantic. */}
        <div className="mt-12 flex flex-col gap-0 lg:mt-16 lg:grid lg:grid-cols-4 lg:gap-4">
          {STEPS.map((step, i) => (
            <Fragment key={step.num}>
              <Reveal delay={i * 80}>
                <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-background p-8">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-3xl font-medium tracking-[-0.02em] text-primary">
                      {step.num}
                    </span>
                    <step.icon className="h-5 w-5 text-foreground/40 lg:hidden" aria-hidden />
                  </div>
                  <h3 className="mt-6 text-xl font-medium tracking-[-0.015em] text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/70">{step.body}</p>
                  <ul className="mt-6 space-y-2 border-t border-border/60 pt-5">
                    {step.details.map((d) => (
                      <li
                        key={d}
                        className="flex items-start gap-2 text-xs leading-relaxed text-foreground/65"
                      >
                        <span className="mt-1.5 inline-block h-1 w-1 flex-none rounded-full bg-primary/80" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
              {i < STEPS.length - 1 ? (
                <div
                  aria-hidden
                  className="flex justify-center py-4 text-foreground/30 lg:hidden"
                >
                  <ChevronDown className="h-5 w-5" />
                </div>
              ) : null}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}
