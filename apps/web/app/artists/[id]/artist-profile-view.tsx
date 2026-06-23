'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { RemoteImage } from '@/components/dashboard/remote-image'
import Link from 'next/link'
import { Lock, MapPin, Star, Sparkles, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import ProfileCard from '@/components/card/profile-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Reveal } from '@/components/landing/reveal'
import { cn } from '@/lib/utils'
import { useAuthSession } from '@/providers/session-provider'
import { usePublicArtist } from '@/lib/hooks/use-talent'
import { useArtistReviews } from '@/lib/hooks/use-reviews'
import type { ReviewWithContext } from '@/lib/api/reviews'
import type { PortfolioItem, ArtistSkill } from '@castflow/types'

interface Props {
  id: string
}

const LINK_PLATFORM_LABEL: Record<string, string> = {
  website: 'Website',
  instagram: 'Instagram',
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  behance: 'Behance',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  imdb: 'IMDb',
  spotlight: 'Spotlight',
  other: 'Link',
}

const EXPERIENCE_LABEL: Record<string, string> = {
  new_face: 'New face',
  semi_pro: 'Semi-pro',
  professional: 'Professional',
}

export function ArtistProfileView({ id }: Props) {
  const router = useRouter()
  const { data: profile, isPending, isError } = usePublicArtist(id)
  const { data: reviewsData } = useArtistReviews(id)
  const reviews = reviewsData ?? []
  // Real session — a logged-in caster sees the "Shortlist" CTA + contact;
  // everyone else sees the public "Sign in to contact" UI. (Audit H11.)
  const { session } = useAuthSession()
  const isCaster = session?.user.role === 'caster'

  const handleContactClick = () => {
    if (!isCaster) {
      router.push(`/login?next=${encodeURIComponent(`/artists/${id}`)}`)
      return
    }
    router.push(`/caster/talent/${id}`)
  }

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-[90rem] px-6 py-24 lg:px-8">
        <p className="text-sm text-foreground/60">Loading profile…</p>
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto w-full max-w-[90rem] px-6 py-24 text-center lg:px-8">
        <h1 className="font-serif text-3xl text-foreground">Artist not found</h1>
        <p className="mt-3 text-sm text-foreground/60">
          This profile may be private or no longer available.
        </p>
        <Link
          href="/artists"
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden /> Back to talent
        </Link>
      </div>
    )
  }

  const primaryPortfolio = profile.portfolioItems?.find((p) => p.isPrimary)
  const heroImage =
    primaryPortfolio?.url ?? profile.portfolioItems?.[0]?.url ?? '/placeholder-avatar.png'

  const ratingDisplay = profile.ratingAvg ? Number(profile.ratingAvg).toFixed(1) : '–'

  return (
    <div className="mx-auto w-full max-w-[90rem] px-6 pb-24 pt-10 lg:px-8 lg:pt-14">
      <Reveal>
        <Link
          href="/artists"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Back to talent
        </Link>
      </Reveal>

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-[420px_1fr] lg:gap-16">
        {/* Left — sticky ProfileCard */}
        <Reveal>
          <div className="lg:sticky lg:top-24">
            <ProfileCard
              name={profile.firstName}
              title={
                profile.artistType === 'model'
                  ? 'Model'
                  : profile.artistType === 'actor'
                    ? 'Actor'
                    : 'Artist'
              }
              handle={
                isCaster && profile.instagramHandle
                  ? profile.instagramHandle.replace(/^@/, '')
                  : profile.firstName.toLowerCase()
              }
              status={profile.availabilityStatus === 'available' ? 'Available' : 'Unavailable'}
              avatarUrl={heroImage}
              contactText={isCaster ? 'Shortlist' : 'Sign in to contact'}
              onContactClick={handleContactClick}
              showUserInfo
              enableTilt
              innerGradient="linear-gradient(155deg, rgba(255,255,255,0) 0%, rgba(20,20,30,0.35) 100%)"
              behindGlowColor="rgba(110, 140, 200, 0.35)"
              behindGlowSize="55%"
            />

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <Stat
                label="Rating"
                value={ratingDisplay}
                sub={
                  profile.ratingCount
                    ? `${profile.ratingCount} review${profile.ratingCount === 1 ? '' : 's'}`
                    : 'No reviews yet'
                }
              />
              <Stat
                label="Booked"
                value={String(profile.jobsCompleted ?? 0)}
                sub="jobs completed"
              />
              <Stat
                label="Response"
                value={
                  profile.responseRate != null
                    ? `${Math.round(Number(profile.responseRate) * 100)}%`
                    : '–'
                }
                sub="reply rate"
              />
            </div>
          </div>
        </Reveal>

        {/* Right — meta + tabs */}
        <Reveal delay={120}>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className="rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em]"
              >
                {profile.artistType}
              </Badge>
              {profile.experienceLevel && (
                <Badge
                  variant="outline"
                  className="rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em]"
                >
                  {EXPERIENCE_LABEL[profile.experienceLevel] ?? profile.experienceLevel}
                </Badge>
              )}
              <Badge className="rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em]">
                <Sparkles className="mr-1 h-3 w-3" aria-hidden /> Approved
              </Badge>
            </div>

            <h1 className="mt-5 font-serif text-5xl leading-tight text-foreground lg:text-6xl">
              {profile.firstName}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-foreground/70">
              {profile.city && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {profile.city}
                </span>
              )}
              {profile.instagramHandle &&
                (isCaster ? (
                  <a
                    href={`https://instagram.com/${profile.instagramHandle.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                  >
                    @{profile.instagramHandle.replace(/^@/, '')}
                  </a>
                ) : (
                  <Link
                    href={`/login?next=${encodeURIComponent(`/artists/${id}`)}`}
                    className="inline-flex items-center gap-1.5 text-foreground/60 transition-colors hover:text-foreground"
                  >
                    <Lock className="h-3 w-3" aria-hidden />
                    Sign in as a caster to view contact
                  </Link>
                ))}
            </div>

            {(profile.links ?? []).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(profile.links ?? []).map((l) => (
                  <a
                    key={l.id}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-[var(--surface-50)] px-3 py-1 text-xs text-foreground/70 transition-colors hover:text-foreground"
                  >
                    <ExternalLink className="h-3 w-3" aria-hidden />
                    {l.label || LINK_PLATFORM_LABEL[l.platform] || l.platform}
                  </a>
                ))}
              </div>
            )}

            {profile.bio && (
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/80">
                {profile.bio}
              </p>
            )}

            <Separator className="my-10" />

            <Tabs defaultValue="portfolio" className="w-full">
              <TabsList className="h-auto justify-start gap-1 rounded-full bg-[var(--surface-50)] p-1">
                <TabsTrigger value="portfolio" className="rounded-full px-4">
                  Portfolio
                </TabsTrigger>
                <TabsTrigger value="about" className="rounded-full px-4">
                  About
                </TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-full px-4">
                  Reviews{' '}
                  {profile.ratingCount > 0 && (
                    <span className="ml-1 text-foreground/50">{profile.ratingCount}</span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="portfolio" className="mt-8">
                <PortfolioGrid items={profile.portfolioItems ?? []} />
              </TabsContent>

              <TabsContent value="about" className="mt-8">
                <AboutBlock profile={profile} />
              </TabsContent>

              <TabsContent value="reviews" className="mt-8">
                <ReviewsBlock reviews={reviews ?? []} />
              </TabsContent>
            </Tabs>
          </div>
        </Reveal>
      </div>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-[var(--surface-50)] px-3 py-4">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/60">
        {label}
      </p>
      <p className="mt-1 font-serif text-2xl text-foreground">{value}</p>
      <p className="mt-0.5 text-[11px] text-foreground/60">{sub}</p>
    </div>
  )
}

function PortfolioGrid({ items }: { items: PortfolioItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  // Track which thumbnail triggered the lightbox so we can return focus to it
  // when the user dismisses (a11y — see M10).
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const closeLightbox = () => {
    setActiveIndex(null)
    // Defer the focus restore one tick so the lightbox's unmount + any
    // focus-trap cleanup completes first.
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  if (items.length === 0) {
    return <EmptyState>No portfolio items yet. This artist hasn&apos;t uploaded work.</EmptyState>
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={(e) => {
              triggerRef.current = e.currentTarget
              setActiveIndex(index)
            }}
            className={cn(
              'group relative aspect-[3/4] overflow-hidden rounded-xl border border-border/60 bg-[var(--surface-50)]',
              'transition-all duration-300 hover:border-foreground/30'
            )}
          >
            {item.type === 'video' ? (
              <video
                src={item.url}
                poster={item.thumbnailUrl ?? undefined}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                muted
                playsInline
              />
            ) : (
              <RemoteImage
                src={item.url}
                alt={item.caption ?? 'Portfolio image'}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            )}
            {(item.title || item.caption) && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <p className="text-xs font-medium text-white">{item.title || item.caption}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <Lightbox
          items={items}
          index={activeIndex}
          onIndex={setActiveIndex}
          onClose={closeLightbox}
        />
      )}
    </>
  )
}

function Lightbox({
  items,
  index,
  onIndex,
  onClose,
}: {
  items: PortfolioItem[]
  index: number
  onIndex: (i: number) => void
  onClose: () => void
}) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  const item = items[index]!
  const hasMany = items.length > 1
  const goPrev = () => onIndex((index - 1 + items.length) % items.length)
  const goNext = () => onIndex((index + 1) % items.length)

  // Portal target only exists on the client. Mounting in an effect also lets us
  // lock body scroll while the gallery is open.
  useEffect(() => {
    setMounted(true)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  // ESC closes, ←/→ navigate, Tab cycles focus within the dialog. (M10 — a11y.)
  useEffect(() => {
    closeBtnRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'ArrowLeft' && hasMany) {
        e.preventDefault()
        goPrev()
        return
      }
      if (e.key === 'ArrowRight' && hasMany) {
        e.preventDefault()
        goNext()
        return
      }
      if (e.key !== 'Tab') return

      const root = dialogRef.current
      if (!root) return
      const focusables = root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, video[controls], [tabindex]:not([tabindex="-1"])'
      )
      if (focusables.length === 0) return
      const first = focusables[0]!
      const last = focusables[focusables.length - 1]!
      const activeEl = document.activeElement as HTMLElement | null

      if (e.shiftKey && activeEl === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, index, hasMany])

  if (!mounted) return null

  // Rendered through a portal to document.body so a transformed/overflow-clipped
  // ancestor (tabs, Reveal animations, the tilt card) can't trap the fixed
  // overlay — it always covers the full viewport like a real gallery viewer.
  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal
      aria-label={item.title ?? item.caption ?? 'Portfolio item'}
      onClick={onClose}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-200 sm:p-8"
    >
      <button
        ref={closeBtnRef}
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg text-white/80 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        ✕
      </button>

      {hasMany ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              goPrev()
            }}
            aria-label="Previous"
            className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white sm:left-6"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              goNext()
            }}
            aria-label="Next"
            className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white sm:right-6"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      ) : null}

      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full max-w-4xl flex-col items-center"
      >
        {item.type === 'video' ? (
          <video src={item.url} controls autoPlay className="max-h-[78vh] w-auto rounded-xl" />
        ) : (
          <RemoteImage
            src={item.url}
            alt={item.caption ?? 'Portfolio image'}
            width={1600}
            height={1200}
            sizes="100vw"
            className="max-h-[78vh] w-auto rounded-xl"
            style={{ width: 'auto', height: 'auto' }}
            priority
          />
        )}
        <div className="mt-4 space-y-2 text-center">
          {(item.title || item.caption) && (
            <p className="text-sm font-medium text-white">{item.title || item.caption}</p>
          )}
          {item.description && (
            <p className="mx-auto max-w-xl text-sm text-white/70">{item.description}</p>
          )}
          {item.links.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {item.links.map((href) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 hover:text-white"
                >
                  <ExternalLink className="h-3 w-3" aria-hidden /> Link
                </a>
              ))}
            </div>
          )}
          {hasMany ? (
            <p className="pt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-white/50">
              {index + 1} / {items.length}
            </p>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  )
}

interface ProfileForAbout {
  artistType: 'model' | 'actor'
  bio?: string | null
  city?: string | null
  skills?: ArtistSkill[]
  modelStats?: unknown
  actorStats?: unknown
}

function AboutBlock({ profile }: { profile: ProfileForAbout }) {
  const skills = profile.skills ?? []

  const statsRows = useMemo<Array<[string, string | null]>>(() => {
    const toStr = (v: unknown): string | null => {
      if (v == null) return null
      if (typeof v === 'string') return v.length > 0 ? v : null
      if (typeof v === 'number') return String(v)
      if (Array.isArray(v)) return v.length > 0 ? v.join(', ') : null
      return null
    }
    if (profile.artistType === 'model' && profile.modelStats) {
      const s = profile.modelStats as Record<string, unknown>
      return [
        ['Height', s['heightCm'] ? `${toStr(s['heightCm']) ?? ''} cm` : null],
        ['Dress size', toStr(s['dressSize'])],
        ['Shoe size', toStr(s['shoeSize'])],
        ['Hair', toStr(s['hairColour'])],
        ['Eyes', toStr(s['eyeColour'])],
        [
          'Measurements',
          s['bustCm'] && s['waistCm'] && s['hipCm']
            ? `${toStr(s['bustCm']) ?? ''} / ${toStr(s['waistCm']) ?? ''} / ${toStr(s['hipCm']) ?? ''} cm`
            : null,
        ],
      ]
    }
    if (profile.artistType === 'actor' && profile.actorStats) {
      const s = profile.actorStats as Record<string, unknown>
      return [
        ['Union', toStr(s['union'])],
        ['Accents', toStr(s['accents'])],
        ['Languages', toStr(s['languages'])],
        ['Reel', toStr(s['reelUrl'])],
      ]
    }
    return []
  }, [profile.artistType, profile.modelStats, profile.actorStats])

  const visible = statsRows.filter((row): row is [string, string] => row[1] !== null)

  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
      <div>
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-foreground/60">
          Stats
        </h2>
        {visible.length === 0 ? (
          <p className="mt-4 text-sm text-foreground/60">No stats provided yet.</p>
        ) : (
          <dl className="mt-4 divide-y divide-border/60">
            {visible.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-3">
                <dt className="text-sm text-foreground/70">{label}</dt>
                <dd className="text-sm font-medium text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div>
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-foreground/60">
          Skills
        </h2>
        {skills.length === 0 ? (
          <p className="mt-4 text-sm text-foreground/60">No skills listed yet.</p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {skills.map((s) => (
              <li key={s.id}>
                <Badge variant="outline" className="rounded-full px-3 py-1.5 text-xs font-medium">
                  {s.skillValue}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function ReviewsBlock({ reviews }: { reviews: ReviewWithContext[] }) {
  const visible = reviews.filter((r) => !r.isRemoved)

  if (visible.length === 0) {
    return (
      <EmptyState>No reviews yet. This artist hasn&apos;t been reviewed by a caster.</EmptyState>
    )
  }

  return (
    <ul className="space-y-5">
      {visible.map((r) => (
        <li key={r.id} className="rounded-2xl border border-border/60 bg-[var(--surface-50)] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-3.5 w-3.5',
                    i < r.rating ? 'fill-primary text-primary' : 'text-foreground/20'
                  )}
                />
              ))}
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/50">
              {new Date(r.createdAt).toLocaleDateString('en-GB', {
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          {r.comment && (
            <p className="mt-3 text-sm leading-relaxed text-foreground/80">{r.comment}</p>
          )}
          {r.booking?.caster?.companyName || r.booking?.job?.title ? (
            <p className="mt-3 text-xs text-foreground/55">
              {r.booking?.caster?.companyName ? (
                <span className="font-medium text-foreground/75">
                  {r.booking.caster.companyName}
                </span>
              ) : null}
              {r.booking?.job?.title ? <> · {r.booking.job.title}</> : null}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-[var(--surface-50)] p-10 text-center">
      <p className="text-sm text-foreground/60">{children}</p>
    </div>
  )
}
