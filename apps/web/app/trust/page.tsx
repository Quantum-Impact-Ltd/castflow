import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Scale,
  Vault,
  UserCheck,
  AlertTriangle,
  FileSignature,
} from 'lucide-react'
import { Nav } from '@/components/landing/nav'
import { Footer } from '@/components/landing/footer'
import { Reveal } from '@/components/landing/reveal'
import { Button } from '@/components/ui/button'
import { EscrowFlowSection } from './escrow-flow-section'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Trust & Safety — CastFlow',
  description:
    'Every artist is ID-verified and over 18. Every booking is escrow-paid. Every dispute is reviewed by a human. Here is exactly how we keep both sides safe.',
}

interface Pillar {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  title: string
  body: string
}

const PILLARS: Pillar[] = [
  {
    icon: UserCheck,
    title: 'ID-verified artists',
    body: 'Every artist submits a government-issued ID at onboarding. A human admin cross-checks it against their profile before approving — no automated bots, no fake faces, no duplicate accounts.',
  },
  {
    icon: ShieldCheck,
    title: '18+ hard block',
    body: 'Date of birth is verified at sign-up. Any account under 18 is rejected on the spot and cannot bid, message, or be booked. Non-negotiable, no exceptions.',
  },
  {
    icon: Vault,
    title: 'Escrow on every booking',
    body: 'Casters pay into a ring-fenced Stripe escrow at booking confirmation. Funds release only when the shoot is confirmed complete — or auto-release 48 hours after shoot date, whichever comes first.',
  },
  {
    icon: Scale,
    title: '72-hour dispute window',
    body: 'Either party can raise a dispute up to 72 hours after the shoot date. Funds freeze until a human admin reviews both sides and rules on the outcome. No bots making payout decisions.',
  },
]

interface PrivacyStage {
  stage: string
  /** What the caster sees about the artist at this stage. */
  casterSees: string[]
  /** What the artist sees about the caster at this stage. */
  artistSees: string[]
  tone: 'public' | 'shortlist' | 'booking' | 'signed'
}

const PRIVACY_STAGES: PrivacyStage[] = [
  {
    stage: 'Public profile',
    tone: 'public',
    casterSees: ['First name', 'Profile portfolio', 'City', 'Stats & skills'],
    artistSees: ['Company name', 'Industry'],
  },
  {
    stage: 'Shortlisted',
    tone: 'shortlist',
    casterSees: ['First name', 'Direct messaging unlocked'],
    artistSees: ['Company name', 'Job title only'],
  },
  {
    stage: 'Booking confirmed',
    tone: 'booking',
    casterSees: ['Full legal name', 'Phone for shoot logistics'],
    artistSees: ['Full company contact', 'Producer name & phone'],
  },
  {
    stage: 'Contract fully signed',
    tone: 'signed',
    casterSees: ['All of the above'],
    artistSees: ['All of the above', 'Exact shoot location revealed'],
  },
]

interface SafetyRule {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  title: string
  body: string
}

const SAFETY: SafetyRule[] = [
  {
    icon: AlertTriangle,
    title: 'Strike system',
    body: 'Late cancellations (under 48 hours) earn a strike. Three strikes triggers an admin review — outcome ranges from a warning to suspension or ban.',
  },
  {
    icon: FileSignature,
    title: 'Permanent contracts',
    body: 'Every booking generates an e-signed contract recording both parties, agreed rate, usage rights, and any exclusivity or NDA clauses. Legally enforceable under UK ECA 2000.',
  },
  {
    icon: Eye,
    title: 'Moderated messaging',
    body: 'Admin can read message threads when a thread is reported or a dispute is open — strictly for moderation and dispute resolution, never marketing.',
  },
  {
    icon: Lock,
    title: 'No off-platform payments',
    body: 'Asking to move payment off-platform is a ToS violation. Both accounts are flagged for review the moment it is reported.',
  },
]

export default function TrustPage() {
  return (
    <>
      <Nav />
      <main className="bg-background">
        {/* Hero */}
        <section className="w-full pb-16 pt-20 lg:pb-24 lg:pt-28">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <Reveal>
              <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-primary">
                Trust & Safety
              </p>
              <h1 className="mt-6 max-w-4xl text-balance text-5xl font-medium leading-[1.04] tracking-[-0.02em] text-foreground sm:text-6xl lg:text-7xl">
                Trust built into{' '}
                <span className="font-serif font-normal italic">every booking.</span>
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-foreground/75">
                Verified artists. Ring-fenced payments. Contracts on every job. Human reviewers on
                every dispute. Here&apos;s exactly how we keep both sides safe.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Four pillars */}
        <section className="w-full pb-24 lg:pb-32">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {PILLARS.map((pillar, i) => (
                <Reveal key={pillar.title} delay={i * 80}>
                  <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-background p-8 transition-all hover:shadow-sm">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <pillar.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <h2 className="mt-6 text-xl font-medium tracking-[-0.015em] text-foreground">
                      {pillar.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/70">{pillar.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy ladder */}
        <section className="w-full bg-[var(--surface-50)] py-24 lg:py-32">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <Reveal>
              <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
                <div className="lg:col-span-5">
                  <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-primary">
                    Contact privacy
                  </p>
                  <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl">
                    Personal info{' '}
                    <span className="font-serif font-normal italic">stays personal</span> until you
                    book.
                  </h2>
                </div>
                <p className="text-lg leading-relaxed text-foreground/75 lg:col-span-7 lg:pt-2">
                  Direct contact details unlock progressively. Browse anonymously, shortlist to
                  message, book to swap real names, sign the contract to reveal the shoot location.
                  No one&apos;s phone is hanging in a public profile.
                </p>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="mt-16 grid gap-4 lg:grid-cols-4">
                {PRIVACY_STAGES.map((stage, i) => (
                  <PrivacyStageCard key={stage.stage} index={i} stage={stage} />
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Escrow flow */}
        <EscrowFlowSection />

        {/* Dispute resolution */}
        <section className="w-full bg-[var(--surface-50)] py-24 lg:py-32">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <Reveal>
              <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
                <div>
                  <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-primary">
                    Dispute resolution
                  </p>
                  <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl">
                    Humans decide <span className="font-serif font-normal italic">hard cases.</span>
                  </h2>
                  <p className="mt-6 text-base leading-relaxed text-foreground/75">
                    A dispute can be raised within 72 hours of the shoot date. Both parties submit
                    their side. An admin reviews the booking, the contract, the message thread, and
                    any media submitted — then rules on the outcome.
                  </p>
                  <Button asChild className="mt-8 rounded-full">
                    <Link href="/contact">
                      Report a concern
                      <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background p-8 lg:p-10">
                  <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/60">
                    Possible outcomes
                  </h3>
                  <ul className="mt-6 space-y-5">
                    <DisputeOutcome
                      label="Full release"
                      body="100% of escrow to the artist. Used when caster's complaint isn't substantiated."
                    />
                    <DisputeOutcome
                      label="Full refund"
                      body="100% returned to the caster. Used when shoot didn't happen or breach is clear."
                    />
                    <DisputeOutcome
                      label="Split decision"
                      body="Custom percentage split — admin enters the exact ratio based on evidence."
                    />
                    <DisputeOutcome
                      label="Strike + outcome"
                      body="Any of the above plus a strike on the offending account. Three strikes triggers a full review."
                    />
                  </ul>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Safety guardrails */}
        <section className="w-full py-24 lg:py-32">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <Reveal>
              <div className="max-w-3xl">
                <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-primary">
                  Ongoing safety
                </p>
                <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl">
                  The rules{' '}
                  <span className="font-serif font-normal italic">don&apos;t stop at sign-up.</span>
                </h2>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="mt-16 grid gap-4 md:grid-cols-2">
                {SAFETY.map((rule) => (
                  <div
                    key={rule.title}
                    className="flex gap-5 rounded-2xl border border-border/60 bg-background p-8"
                  >
                    <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primary/10 text-primary">
                      <rule.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-lg font-medium tracking-[-0.015em] text-foreground">
                        {rule.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/70">{rule.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Final CTA */}
        <section className="w-full pb-28 lg:pb-36">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <Reveal>
              <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-foreground px-10 py-20 text-center text-background lg:px-16">
                <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-background/60">
                  Safety first
                </p>
                <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
                  Spot something off?{' '}
                  <span className="font-serif font-normal italic">Tell us.</span>
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-background/70">
                  Every report goes to a human within 24 hours. Identity-related concerns are
                  escalated same-day.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="rounded-full bg-background text-foreground hover:bg-background/90"
                  >
                    <Link href="/contact">
                      Contact safety team
                      <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
                  >
                    <Link href="/terms">Read the Terms</Link>
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

function PrivacyStageCard({ index, stage }: { index: number; stage: PrivacyStage }) {
  const isPublic = stage.tone === 'public'
  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-2xl border bg-background p-7',
        stage.tone === 'signed' ? 'border-primary shadow-md' : 'border-border/60'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/60">
          Stage {String(index + 1).padStart(2, '0')}
        </span>
        <span
          className={cn(
            'inline-flex h-7 w-7 items-center justify-center rounded-full',
            stage.tone === 'signed'
              ? 'bg-primary/10 text-primary'
              : 'bg-foreground/5 text-foreground/60'
          )}
        >
          {isPublic ? (
            <EyeOff className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Eye className="h-3.5 w-3.5" aria-hidden />
          )}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-medium tracking-[-0.015em] text-foreground">
        {stage.stage}
      </h3>
      <div className="mt-6 space-y-4 text-sm">
        <PrivacyList label="Caster sees" items={stage.casterSees} />
        <PrivacyList label="Artist sees" items={stage.artistSees} />
      </div>
    </div>
  )
}

function PrivacyList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
        {label}
      </p>
      <ul className="mt-2 space-y-1">
        {items.map((item) => (
          <li key={item} className="text-sm leading-snug text-foreground/85">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function DisputeOutcome({ label, body }: { label: string; body: string }) {
  return (
    <li className="flex flex-col gap-1.5 border-l-2 border-primary/40 pl-4">
      <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
        {label}
      </span>
      <span className="text-sm leading-relaxed text-foreground/70">{body}</span>
    </li>
  )
}
