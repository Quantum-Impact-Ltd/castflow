'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArrowRight,
  Camera,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock,
  FileText,
  Lock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from 'lucide-react'
import type { Job } from '@castflow/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Reveal } from '@/components/landing/reveal'
import { ShimmerButtonLink } from '@/components/landing/shimmer-button-link'
import { RemoteImage } from '@/components/dashboard/remote-image'
import { formatCurrency, cn } from '@/lib/utils'
import { ENABLE_MOCK_FALLBACK } from '@/lib/site'
import { useAuthSession } from '@/providers/session-provider'
import { useJob } from '@/lib/hooks/use-jobs'
import {
  getMockShoot,
  getSimilarShoots,
  type CasterMeta,
  type ShootDetailExtras,
} from '@/lib/mock/shoots'

interface Props {
  id: string
}

const CATEGORY_LABEL: Record<string, string> = {
  model: 'Model',
  actor: 'Actor',
  voiceover: 'Voiceover',
  extra: 'Extra',
}

export function ShootDetailView({ id }: Props) {
  const router = useRouter()
  // Live job detail first; fall back to mock when the id isn't a real job
  // (e.g. the seeded demo shoots) — but only in demo/dev. On staging/prod an
  // unknown id resolves to "Shoot not found" rather than fabricated detail.
  const { data: realJob, isLoading } = useJob(id)
  const mock = useMemo(
    () => (ENABLE_MOCK_FALLBACK ? getMockShoot(id) : null),
    [id]
  )

  // Real jobs render the same layout but with no enrichment extras (caster
  // stats, wardrobe, perks, cancellation policy, similar shoots). Those are
  // mock-only and gated on `extras` below.
  const shoot: Job | null = realJob ?? mock
  const extras: ShootDetailExtras | null = realJob ? null : mock

  // Real session — a logged-in artist sees the actual bid CTA. (Audit H11.)
  const { session } = useAuthSession()
  const isAuthed = Boolean(session?.user)
  const isArtist = session?.user.role === 'artist'

  const handleApply = () => {
    if (!shoot) return
    if (!isAuthed) {
      router.push(`/login?next=${encodeURIComponent(`/shoots/${shoot.id}`)}`)
      return
    }
    if (!isArtist) {
      router.push('/register?role=artist')
      return
    }
    router.push(`/artist/jobs/${shoot.id}/bid`)
  }

  if (!shoot) {
    if (isLoading) {
      return (
        <div className="mx-auto w-full max-w-[90rem] px-6 py-24 lg:px-8">
          <p className="text-sm text-foreground/60">Loading shoot…</p>
        </div>
      )
    }
    return (
      <div className="mx-auto w-full max-w-[90rem] px-6 py-24 text-center lg:px-8">
        <h1 className="font-serif text-3xl text-foreground">Shoot not found</h1>
        <p className="mt-3 text-sm text-foreground/60">
          This brief may have closed, filled, or passed its application deadline.
        </p>
        <Link
          href="/shoots"
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden /> Back to live shoots
        </Link>
      </div>
    )
  }

  const remainingSpots = Math.max(shoot.headcountRequired - shoot.headcountFilled, 0)
  const similar = extras ? getSimilarShoots(extras.similarShootIds) : []
  const rateLabel = formatRate(shoot)
  const shootWhen = formatShootDate(shoot.shootDate, shoot.shootEndDate)
  const applicationDeadline = new Date(shoot.applicationDeadline).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const daysToApply = Math.max(
    Math.ceil((new Date(shoot.applicationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    0
  )
  const casterName = shoot.caster?.companyName ?? 'A verified caster'

  return (
    <div className="mx-auto w-full max-w-[90rem] px-6 pb-24 pt-10 lg:px-8 lg:pt-14">
      <Reveal>
        <Link
          href="/shoots"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Back to live shoots
        </Link>
      </Reveal>

      {/* HERO */}
      <Reveal>
        <div className="relative mt-8 overflow-hidden rounded-3xl border border-border/60 bg-foreground">
          <div className="relative aspect-[16/9] w-full overflow-hidden lg:aspect-[21/9]">
            <DetailCover url={shoot.coverImageUrl} alt={shoot.title} />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"
            />

            {/* Top overlays */}
            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-6 lg:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-white">
                  Live brief · accepting bids
                </span>
              </div>
              {shoot.requiresNda ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/95 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-950">
                  <ShieldCheck className="h-3 w-3" aria-hidden /> NDA required
                </span>
              ) : null}
            </div>

            {/* Bottom — title block */}
            <div className="absolute inset-x-0 bottom-0 p-6 text-white lg:p-10">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">
                {CATEGORY_LABEL[shoot.category] ?? shoot.category}
                {shoot.subcategory ? ` · ${shoot.subcategory}` : ''}
              </p>
              <h1 className="mt-3 max-w-4xl text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
                {shoot.title}
              </h1>
              <p className="mt-4 text-base font-medium text-white/85 lg:text-lg">
                Posted by {casterName}
                {extras?.casterMeta.verified ? (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white backdrop-blur">
                    <CheckCircle2 className="h-3 w-3" aria-hidden /> Verified
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          {/* Quick-facts strip */}
          <div className="grid grid-cols-2 divide-x divide-border/60 border-t border-border/60 bg-background lg:grid-cols-4">
            <HeroMeta
              icon={<CalendarDays className="h-4 w-4" aria-hidden />}
              label="When"
              value={shootWhen}
            />
            <HeroMeta
              icon={<MapPin className="h-4 w-4" aria-hidden />}
              label="Where"
              value={shoot.locationCity}
              sub="Exact location after sign-in"
            />
            <HeroMeta
              icon={<Clock className="h-4 w-4" aria-hidden />}
              label="Rate"
              value={rateLabel}
              sub={shoot.shootDurationHours ? `${shoot.shootDurationHours}h call` : undefined}
              accent
            />
            <HeroMeta
              icon={<Users className="h-4 w-4" aria-hidden />}
              label="Spots"
              value={
                <>
                  {remainingSpots} of {shoot.headcountRequired}
                </>
              }
              sub="open right now"
            />
          </div>
        </div>
      </Reveal>

      {/* MAIN GRID */}
      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
        {/* LEFT — public detail */}
        <Reveal delay={80}>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em]"
              >
                {CATEGORY_LABEL[shoot.category]}
              </Badge>
              <Badge
                variant="outline"
                className="rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em]"
              >
                {shoot.paymentType === 'fixed' ? 'Flat fee' : 'Hourly'}
              </Badge>
              {shoot.exclusivity ? (
                <Badge
                  variant="outline"
                  className="rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em]"
                >
                  Exclusivity
                </Badge>
              ) : null}
              {shoot.genderRequired !== 'any' ? (
                <Badge
                  variant="outline"
                  className="rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] capitalize"
                >
                  {shoot.genderRequired}
                </Badge>
              ) : null}
              {shoot.ageMin || shoot.ageMax ? (
                <Badge
                  variant="outline"
                  className="rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em]"
                >
                  {shoot.ageMin ?? '18'}–{shoot.ageMax ?? '70'}
                </Badge>
              ) : null}
            </div>

            <Separator className="my-10" />

            <Tabs defaultValue="brief" className="w-full">
              <TabsList className="h-auto justify-start gap-1 rounded-full bg-[var(--surface-50)] p-1">
                <TabsTrigger value="brief" className="rounded-full px-4">
                  Brief
                </TabsTrigger>
                <TabsTrigger value="details" className="rounded-full px-4">
                  Details
                </TabsTrigger>
                <TabsTrigger value="caster" className="rounded-full px-4">
                  Caster
                </TabsTrigger>
              </TabsList>

              <TabsContent value="brief" className="mt-8 space-y-10">
                <section>
                  <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-foreground/60">
                    The brief
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/85">
                    {shoot.description}
                  </p>
                </section>

                {shoot.skillsRequired.length > 0 ? (
                  <section>
                    <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-foreground/60">
                      Skills required
                    </h2>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {shoot.skillsRequired.map((skill) => (
                        <li key={skill}>
                          <Badge
                            variant="outline"
                            className="rounded-full px-3 py-1.5 text-xs font-medium"
                          >
                            {skill}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <section>
                  <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-foreground/60">
                    Usage rights
                  </h2>
                  <p className="mt-4 text-sm text-foreground/85">
                    {shoot.usageRights || 'Not specified.'}
                  </p>
                </section>
              </TabsContent>

              <TabsContent value="details" className="mt-8 space-y-6">
                {/* Call time + exact address are gated until a booking is
                    confirmed (CLAUDE.md non-negotiable) — always locked on the
                    public page, never rendered into the DOM. */}
                <DetailRow label="Call time" locked lockHint="Shared with the booked artist" />
                <DetailRow
                  label="Shoot address"
                  locked
                  lockHint="Released after booking confirmed"
                />
                {extras ? <DetailRow label="Wardrobe" value={extras.wardrobe} /> : null}
                {extras ? (
                  <DetailRow label="On-set perks" value={extras.perks.join(' · ')} />
                ) : null}
                {extras ? (
                  <DetailRow label="Cancellation policy" value={extras.cancellationPolicy} />
                ) : null}
                <DetailRow
                  label="Application deadline"
                  value={`${applicationDeadline} — ${daysToApply} days left`}
                />
              </TabsContent>

              <TabsContent value="caster" className="mt-8">
                <CasterCard companyName={casterName} meta={extras?.casterMeta} />
              </TabsContent>
            </Tabs>

            {/* Similar shoots — mock-only (no similar-jobs endpoint yet). */}
            {similar.length > 0 ? (
              <section className="mt-20">
                <div className="flex items-end justify-between gap-4">
                  <h2 className="text-2xl font-medium tracking-[-0.02em] text-foreground">
                    Similar live <span className="font-serif italic">briefs</span>
                  </h2>
                  <Link
                    href="/shoots"
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
                  >
                    See all
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>
                </div>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {similar.slice(0, 3).map((s) => (
                    <SimilarCard key={s.id} shoot={s} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </Reveal>

        {/* RIGHT — sticky bid panel */}
        <Reveal delay={160}>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-border/60 bg-background">
              <div className="p-8">
                <div className="flex items-baseline justify-between">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/60">
                    {shoot.rateSetBy === 'open' ? 'Open to bids' : 'Rate'}
                  </p>
                  {remainingSpots > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Hiring
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/60">
                      Filled
                    </span>
                  )}
                </div>

                <p className="mt-3 text-4xl font-medium tracking-[-0.02em] text-foreground">
                  {rateLabel}
                </p>
                <p className="mt-1 text-xs text-foreground/60">
                  {shoot.paymentType === 'fixed'
                    ? 'Flat fee · paid directly by the caster'
                    : `Hourly · ~${shoot.shootDurationHours ?? 0}h estimated · paid directly by the caster`}
                </p>

                <Separator className="my-6" />

                <ul className="space-y-3 text-sm text-foreground/80">
                  <KeyFact
                    icon={<CalendarDays className="h-4 w-4" aria-hidden />}
                    label={shootWhen}
                    sub={`Apply by ${applicationDeadline}`}
                  />
                  <KeyFact
                    icon={<MapPin className="h-4 w-4" aria-hidden />}
                    label={shoot.locationCity}
                    sub="Exact address after booking"
                  />
                  <KeyFact
                    icon={<Users className="h-4 w-4" aria-hidden />}
                    label={`${remainingSpots} of ${shoot.headcountRequired} spots open`}
                    sub={`${daysToApply} days left to apply`}
                  />
                  <KeyFact
                    icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
                    label="Paid directly by the caster"
                    sub="Off-platform — CastFlow takes no cut"
                  />
                </ul>

                {isAuthed && isArtist ? (
                  <Button
                    onClick={handleApply}
                    size="lg"
                    className="mt-8 h-12 w-full rounded-full text-base"
                  >
                    Submit a bid
                    <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
                  </Button>
                ) : (
                  <div className="mt-8">
                    <ShimmerButtonLink
                      href={`/login?next=${encodeURIComponent(`/shoots/${shoot.id}`)}`}
                      className="h-12 w-full px-7 text-base font-medium"
                    >
                      Sign in to bid
                      <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
                    </ShimmerButtonLink>
                    <Button
                      onClick={() => router.push('/register?role=artist')}
                      variant="ghost"
                      className="mt-2 h-11 w-full rounded-full text-sm"
                    >
                      Not an artist yet? Apply to join
                    </Button>
                  </div>
                )}

                <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-relaxed text-foreground/55">
                  <Lock className="mt-0.5 h-3 w-3 flex-none" aria-hidden />
                  Contact details, exact address, and call sheet release after booking is confirmed.
                </p>
              </div>
            </div>
          </aside>
        </Reveal>
      </div>
    </div>
  )
}

/** Hero cover for the detail page. Falls back to a quiet placeholder when the
 *  job has no `coverImageUrl`. R2-served, so RemoteImage. */
function DetailCover({ url, alt }: { url: string | null; alt: string }) {
  if (url) {
    return <RemoteImage src={url} alt={alt} fill sizes="100vw" className="object-cover" priority />
  }
  return (
    <div
      className="flex h-full w-full items-center justify-center bg-gradient-to-br from-foreground to-foreground/80"
      aria-hidden
    >
      <Camera className="h-12 w-12 text-background/20" />
    </div>
  )
}

function HeroMeta({
  icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  sub?: string
  accent?: boolean
}) {
  return (
    <div className={cn('flex flex-col gap-1 px-6 py-5', accent && 'bg-[var(--surface-50)]')}>
      <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
        <span className="text-foreground/40">{icon}</span>
        {label}
      </span>
      <span className="truncate text-base font-medium text-foreground">{value}</span>
      {sub ? <span className="truncate text-[11px] text-foreground/55">{sub}</span> : null}
    </div>
  )
}

function DetailRow({
  label,
  value,
  locked = false,
  lockHint,
}: {
  label: string
  /** Omit (or pass empty) when locked — the locked branch never renders this. */
  value?: string
  locked?: boolean
  lockHint?: string
}) {
  const pathname = usePathname()
  // When locked we MUST NOT render the real `value` — CSS blur is presentation
  // only, the value is still in the DOM for anyone with DevTools. Render an
  // opaque placeholder so the unauthorised value never leaves the server's
  // hand. CLAUDE.md non-negotiable rule. (Audit C4.)
  return (
    <div className="grid grid-cols-1 gap-2 border-b border-border/60 pb-6 last:border-b-0 sm:grid-cols-[200px_1fr] sm:gap-6">
      <dt className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-foreground/55">
        {label}
      </dt>
      <dd className="text-sm leading-relaxed text-foreground/85">
        {locked ? (
          <span className="inline-flex flex-wrap items-center gap-2">
            <span
              aria-hidden
              className="select-none rounded-md bg-foreground/5 px-2.5 py-1 font-mono text-xs text-foreground/40"
            >
              ••••• ••• ••
            </span>
            <Link
              href={`/login?next=${encodeURIComponent(pathname ?? '/shoots')}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-foreground/70 underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              <Lock className="h-3 w-3" aria-hidden /> Sign in to view
            </Link>
            {lockHint ? <span className="text-[11px] text-foreground/50">{lockHint}</span> : null}
          </span>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}

function KeyFact({ icon, label, sub }: { icon: React.ReactNode; label: string; sub?: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-foreground/5 text-foreground/70">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sub ? <p className="text-xs text-foreground/55">{sub}</p> : null}
      </div>
    </li>
  )
}

function CasterCard({ companyName, meta }: { companyName: string; meta?: CasterMeta }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-[var(--surface-50)] p-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
            Posted by
          </p>
          <h3 className="mt-2 text-3xl font-medium leading-tight tracking-[-0.015em] text-foreground">
            {companyName}
          </h3>
          {meta?.verified ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden /> ID-verified caster
            </p>
          ) : null}
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
          <Sparkles className="h-3 w-3" aria-hidden /> Trusted
        </span>
      </div>

      {meta ? (
        <dl className="mt-8 grid grid-cols-3 gap-4">
          <CasterStat label="Shoots posted" value={meta.shootsPosted} />
          <CasterStat
            label="Rating"
            value={
              <span className="inline-flex items-center gap-1">
                {meta.rating.toFixed(1)}
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              </span>
            }
            sub={`${meta.ratingCount} reviews`}
          />
          <CasterStat label="Member since" value={meta.memberSince} />
        </dl>
      ) : null}

      <p className="mt-8 flex items-start gap-2 text-sm leading-relaxed text-foreground/70">
        <FileText className="mt-0.5 h-4 w-4 flex-none text-foreground/50" aria-hidden />
        All contracts on CastFlow include NDA, usage rights, and exclusivity terms. Both parties
        sign before the shoot address is revealed.
      </p>
    </div>
  )
}

function CasterStat({
  label,
  value,
  sub,
}: {
  label: string
  value: React.ReactNode
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background px-4 py-3">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
        {label}
      </p>
      <p className="mt-1 font-serif text-xl text-foreground">{value}</p>
      {sub ? <p className="mt-0.5 text-[11px] text-foreground/55">{sub}</p> : null}
    </div>
  )
}

function SimilarCard({ shoot }: { shoot: Job }) {
  return (
    <Link href={`/shoots/${shoot.id}`} className="group block">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[var(--surface-50)]">
        {shoot.coverImageUrl ? (
          <RemoteImage
            src={shoot.coverImageUrl}
            alt={shoot.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--surface-50)] to-foreground/[0.05]"
            aria-hidden
          >
            <Camera className="h-8 w-8 text-foreground/15" />
          </div>
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"
        />
        <div className="absolute left-4 top-4">
          <span className="inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground backdrop-blur">
            {CATEGORY_LABEL[shoot.category]}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
            {shoot.caster?.companyName ?? 'A verified caster'}
          </p>
          <p className="mt-1.5 line-clamp-2 text-base font-medium leading-tight">{shoot.title}</p>
          <p className="mt-2 inline-flex items-center gap-3 text-xs text-white/85">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden /> {shoot.locationCity}
            </span>
            <span>{formatRate(shoot)}</span>
          </p>
        </div>
      </div>
    </Link>
  )
}

function formatRate(shoot: Pick<Job, 'rateSetBy' | 'paymentType' | 'rateAmount'>): string {
  if (shoot.rateSetBy === 'open' || shoot.rateAmount == null) {
    return 'Open to bids'
  }
  if (shoot.paymentType === 'hourly') {
    return `${formatCurrency(shoot.rateAmount)}/hr`
  }
  return formatCurrency(shoot.rateAmount)
}

function formatShootDate(start: string, end: string | null | undefined): string {
  const d = new Date(start)
  const fmt = (date: Date) => date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  if (!end) return fmt(d)
  const e = new Date(end)
  if (fmt(d) === fmt(e)) return fmt(d)
  return `${fmt(d)} → ${fmt(e)}`
}
