'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, MapPin, Search, SlidersHorizontal, Star } from 'lucide-react'
import type { PublicArtistProfile } from '@/lib/api/talent'
import { Reveal } from '@/components/landing/reveal'
import { RemoteImage } from '@/components/dashboard/remote-image'
import { useTalentSearch } from '@/lib/hooks/use-talent'
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MOCK_ARTISTS } from '@/lib/mock/artists'
import { cn } from '@/lib/utils'

type TypeFilter = 'all' | 'model' | 'actor'
type ExperienceFilter = 'all' | 'new_face' | 'semi_pro' | 'professional'
type AvailabilityFilter = 'all' | 'available'
type SortKey = 'rating' | 'jobs' | 'newest'

const TYPE_OPTIONS: Array<{ value: TypeFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'model', label: 'Models' },
  { value: 'actor', label: 'Actors' },
]

const EXPERIENCE_OPTIONS: Array<{ value: ExperienceFilter; label: string }> = [
  { value: 'all', label: 'Any level' },
  { value: 'professional', label: 'Professional' },
  { value: 'semi_pro', label: 'Semi-pro' },
  { value: 'new_face', label: 'New face' },
]

const AVAILABILITY_OPTIONS: Array<{ value: AvailabilityFilter; label: string }> = [
  { value: 'all', label: 'All artists' },
  { value: 'available', label: 'Available only' },
]

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'rating', label: 'Highest rated' },
  { value: 'jobs', label: 'Most booked' },
  { value: 'newest', label: 'Newest joined' },
]

const EXPERIENCE_LABEL: Record<Exclude<ExperienceFilter, 'all'>, string> = {
  new_face: 'New face',
  semi_pro: 'Semi-pro',
  professional: 'Professional',
}

export function TalentContent() {
  // Live public directory first; fall back to mock talent only when the
  // backend returns nothing so the page still demos richly on a fresh platform.
  const { data } = useTalentSearch({ limit: 60 })
  const allArtists = useMemo(
    () => (data && data.length > 0 ? data : Object.values(MOCK_ARTISTS)),
    [data]
  )
  const [query, setQuery] = useState('')
  // Debounce the free-text query so re-filtering doesn't run on every
  // keystroke. Select-based facets below stay synchronous because they
  // only change on user action, not on every key. (Audit M15.)
  const debouncedQuery = useDebouncedValue(query, 250)
  const [type, setType] = useState<TypeFilter>('all')
  const [city, setCity] = useState<string>('all')
  const [exp, setExp] = useState<ExperienceFilter>('all')
  const [avail, setAvail] = useState<AvailabilityFilter>('all')
  const [sort, setSort] = useState<SortKey>('rating')

  const cities = useMemo(() => {
    const set = new Set<string>()
    for (const a of allArtists) if (a.city) set.add(a.city)
    return Array.from(set).sort()
  }, [allArtists])

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    const matched = allArtists.filter((a) => {
      if (type !== 'all' && a.artistType !== type) return false
      if (city !== 'all' && a.city !== city) return false
      if (exp !== 'all' && a.experienceLevel !== exp) return false
      if (avail === 'available' && a.availabilityStatus !== 'available') return false
      if (!q) return true
      const hay =
        `${a.firstName} ${a.city ?? ''} ${a.bio ?? ''} ${a.skills?.map((s) => s.skillValue).join(' ') ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
    const sorted = [...matched]
    if (sort === 'rating') {
      sorted.sort((a, b) => Number(b.ratingAvg ?? 0) - Number(a.ratingAvg ?? 0))
    } else if (sort === 'jobs') {
      sorted.sort((a, b) => (b.jobsCompleted ?? 0) - (a.jobsCompleted ?? 0))
    } else if (sort === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    return sorted
  }, [allArtists, debouncedQuery, type, city, exp, avail, sort])

  const featured = useMemo(
    () => [...allArtists].sort((a, b) => Number(b.ratingAvg ?? 0) - Number(a.ratingAvg ?? 0))[0]!,
    [allArtists]
  )

  const reset = () => {
    setQuery('')
    setType('all')
    setCity('all')
    setExp('all')
    setAvail('all')
  }

  return (
    <>
      <Hero count={allArtists.length} featured={featured} />

      <section className="border-y border-border/60 bg-background">
        <div className="mx-auto w-full max-w-[90rem] px-6 py-4 lg:px-8">
          <FilterBar
            query={query}
            onQuery={setQuery}
            type={type}
            onType={setType}
            city={city}
            onCity={setCity}
            cities={cities}
            exp={exp}
            onExp={setExp}
            avail={avail}
            onAvail={setAvail}
            sort={sort}
            onSort={setSort}
          />
        </div>
      </section>

      <section className="w-full pb-20 pt-12 lg:pb-28 lg:pt-16">
        <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/60">
              {filtered.length} {filtered.length === 1 ? 'artist' : 'artists'} · sorted by{' '}
              {SORT_OPTIONS.find((o) => o.value === sort)?.label.toLowerCase()}
            </p>
            <Link
              href="/login?redirect=/talent"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              Sign in as a caster to shortlist
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>

          {filtered.length === 0 ? (
            <EmptyState onReset={reset} />
          ) : (
            <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((artist, i) => (
                <Reveal key={artist.id} delay={Math.min(i * 40, 200)}>
                  <ArtistCard artist={artist} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <FinalCta />
    </>
  )
}

function Hero({ count, featured }: { count: number; featured: PublicArtistProfile }) {
  const heroImg =
    featured.portfolioItems?.find((p) => p.isPrimary)?.url ??
    featured.portfolioItems?.[0]?.url ??
    ''
  return (
    <section className="relative w-full overflow-hidden pb-16 pt-16 lg:pb-24 lg:pt-24">
      <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left: copy */}
          <Reveal className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-[var(--surface-50)] px-4 py-1.5">
              <BadgeCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em]">
                Verified UK talent
              </span>
            </div>

            <h1 className="mt-6 max-w-3xl text-balance text-5xl font-medium leading-[1.02] tracking-[-0.025em] text-foreground sm:text-6xl lg:text-7xl">
              {count} approved{' '}
              <span className="font-serif font-normal italic">models and actors</span> on the
              platform.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-foreground/75">
              Every artist is ID-verified, 18+, and admin-approved. Filter by type, city, and
              experience. Click through for portfolio, stats, and reviews.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-foreground/70">
              <Tag>ID + age checked</Tag>
              <Tag>Approved by humans</Tag>
              <Tag>Portfolios + reviews</Tag>
            </div>
          </Reveal>

          {/* Right: featured artist card */}
          <Reveal delay={120} className="lg:col-span-5">
            <Link
              href={`/artists/${featured.id}`}
              className="group relative block overflow-hidden rounded-3xl border border-border/60 bg-background shadow-sm"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                {heroImg && (
                  <RemoteImage
                    src={heroImg}
                    alt={`${featured.firstName} portfolio cover`}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    priority
                  />
                )}
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent"
                  aria-hidden
                />
                <div className="absolute left-5 top-5 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground backdrop-blur">
                    <BadgeCheck className="h-3 w-3 text-primary" aria-hidden />
                    Top rated · featured
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
                    {featured.artistType === 'model' ? 'Model' : 'Actor'} · {featured.city}
                  </p>
                  <h2 className="mt-2 font-serif text-4xl leading-[1.05] tracking-[-0.01em]">
                    {featured.firstName}
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-border/60 bg-background">
                <HeroMeta
                  label="Rating"
                  value={featured.ratingAvg != null ? Number(featured.ratingAvg).toFixed(1) : '–'}
                  accent
                />
                <HeroMeta label="Booked" value={`${featured.jobsCompleted ?? 0} jobs`} />
                <HeroMeta
                  label="Level"
                  value={
                    featured.experienceLevel ? EXPERIENCE_LABEL[featured.experienceLevel] : '–'
                  }
                />
              </div>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function HeroMeta({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4">
      <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
        {label}
      </span>
      <span
        className={cn(
          'truncate text-sm font-medium',
          accent ? 'text-foreground' : 'text-foreground/85'
        )}
      >
        {value}
      </span>
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-block h-1 w-1 rounded-full bg-foreground/35" aria-hidden />
      <span className="font-medium">{children}</span>
    </span>
  )
}

function FilterBar({
  query,
  onQuery,
  type,
  onType,
  city,
  onCity,
  cities,
  exp,
  onExp,
  avail,
  onAvail,
  sort,
  onSort,
}: {
  query: string
  onQuery: (v: string) => void
  type: TypeFilter
  onType: (v: TypeFilter) => void
  city: string
  onCity: (v: string) => void
  cities: string[]
  exp: ExperienceFilter
  onExp: (v: ExperienceFilter) => void
  avail: AvailabilityFilter
  onAvail: (v: AvailabilityFilter) => void
  sort: SortKey
  onSort: (v: SortKey) => void
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1 lg:max-w-md">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search name, city, or skill"
          className="h-11 rounded-full border-border/60 bg-[var(--surface-50)] pl-10 text-sm focus-visible:bg-background"
        />
      </div>

      <div className="-mx-6 flex items-center gap-2 overflow-x-auto px-6 lg:mx-0 lg:flex-1 lg:overflow-visible lg:px-0">
        <PillSelect
          icon={SlidersHorizontal}
          value={type}
          onChange={(v) => onType(v as TypeFilter)}
          options={TYPE_OPTIONS}
        />
        <PillSelect
          value={city}
          onChange={onCity}
          options={[
            { value: 'all', label: 'All UK' },
            ...cities.map((c) => ({ value: c, label: c })),
          ]}
        />
        <PillSelect
          value={exp}
          onChange={(v) => onExp(v as ExperienceFilter)}
          options={EXPERIENCE_OPTIONS}
        />
        <PillSelect
          value={avail}
          onChange={(v) => onAvail(v as AvailabilityFilter)}
          options={AVAILABILITY_OPTIONS}
        />
        <div className="ml-auto flex-none">
          <PillSelect value={sort} onChange={(v) => onSort(v as SortKey)} options={SORT_OPTIONS} />
        </div>
      </div>
    </div>
  )
}

function PillSelect({
  icon: Icon,
  value,
  onChange,
  options,
}: {
  icon?: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
}) {
  const current = options.find((o) => o.value === value)?.label ?? value
  const active = !(value === 'all' || value === 'rating')
  return (
    <label
      className={cn(
        'group relative inline-flex h-11 flex-none cursor-pointer items-center gap-2 rounded-full border border-border/60 bg-[var(--surface-50)] pl-4 pr-9 text-sm font-medium text-foreground transition-colors hover:border-foreground/40 hover:bg-background',
        active &&
          'border-foreground bg-foreground text-background hover:bg-foreground hover:text-background'
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
      <span className="whitespace-nowrap">{current}</span>
      <svg
        aria-hidden
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-3.5 top-1/2 h-3 w-3 -translate-y-1/2 opacity-70"
      >
        <path
          d="M2.5 4.5L6 8L9.5 4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function ArtistCard({ artist }: { artist: PublicArtistProfile }) {
  const hero =
    artist.portfolioItems?.find((p) => p.isPrimary)?.url ?? artist.portfolioItems?.[0]?.url ?? ''
  const rating = artist.ratingAvg != null ? Number(artist.ratingAvg).toFixed(1) : null
  const isAvailable = artist.availabilityStatus === 'available'

  return (
    <Link href={`/artists/${artist.id}`} className="group block">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[var(--surface-50)]">
        {hero && (
          <RemoteImage
            src={hero}
            alt={`${artist.firstName} portfolio cover`}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className={cn(
              'object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]',
              !isAvailable && 'grayscale-[40%]'
            )}
          />
        )}

        {/* Availability badge — readable at glance per audit P1 (2x2 dot
            was invisible). Pill with status + dot, top-right corner. */}
        <span
          className={cn(
            'absolute right-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
            'font-mono text-[10px] font-semibold uppercase tracking-[0.18em]',
            isAvailable ? 'bg-emerald-500/95 text-emerald-50' : 'bg-foreground/70 text-background'
          )}
        >
          <span className="relative flex h-1.5 w-1.5">
            {isAvailable ? (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-200 opacity-80" />
            ) : null}
            <span
              className={cn(
                'relative inline-flex h-1.5 w-1.5 rounded-full',
                isAvailable ? 'bg-emerald-200' : 'bg-background/80'
              )}
            />
          </span>
          {isAvailable ? 'Available' : 'Booked'}
        </span>

        {/* Bottom gradient sealing the text */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2/5 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
          aria-hidden
        />

        {/* Name + rating, anchored bottom */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 p-5 text-white">
          <div>
            <p className="font-serif text-[26px] leading-[1.05] tracking-[-0.01em]">
              {artist.firstName}
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-white/80">
              <MapPin className="h-3 w-3" aria-hidden />
              {artist.city}
            </p>
          </div>
          {rating && (
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-white">
              <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" aria-hidden />
              {rating}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between px-1">
        <p className="text-sm text-foreground">
          <span className="font-medium">{artist.artistType === 'model' ? 'Model' : 'Actor'}</span>
          {artist.experienceLevel && (
            <span className="text-foreground/55">
              {' '}
              · {EXPERIENCE_LABEL[artist.experienceLevel]}
            </span>
          )}
        </p>
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/45 transition-colors group-hover:text-foreground">
          View →
        </span>
      </div>
    </Link>
  )
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="mt-16 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-[var(--surface-50)] px-8 py-20 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-foreground/5 text-foreground/50">
        <Search className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="mt-5 font-serif text-2xl text-foreground">No artists match those filters.</h3>
      <p className="mt-2 max-w-md text-sm text-foreground/70">
        Try a different city, experience level, or clear the search query.
      </p>
      <Button onClick={onReset} variant="outline" className="mt-6 rounded-full">
        Reset filters
      </Button>
    </div>
  )
}

function FinalCta() {
  return (
    <section className="w-full pb-28 lg:pb-36">
      <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-foreground px-10 py-20 text-center text-background lg:px-16">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-background/60">
              Cast in days
            </p>
            <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
              Shortlist talent, book in one click.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-background/70">
              Sign up as a caster to unlock direct messaging, side-by-side bid comparison, and
              built-in escrow payments.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-background text-foreground hover:bg-background/90"
              >
                <Link href="/register?role=caster">
                  Start casting
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
