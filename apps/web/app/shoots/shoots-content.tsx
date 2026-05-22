'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarDays, MapPin, Users, Search, SlidersHorizontal } from 'lucide-react'
import { Reveal } from '@/components/landing/reveal'
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NumberTicker } from '@/components/ui/number-ticker'
import { MOCK_SHOOTS, type PublicJob } from '@/lib/mock/shoots'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

type CategoryFilter = 'all' | 'model' | 'actor' | 'voiceover' | 'extra'
type PaymentFilter = 'all' | 'fixed' | 'hourly'
type SortKey = 'soonest' | 'newest' | 'rate-high'

const CATEGORY_LABEL: Record<Exclude<CategoryFilter, 'all'>, string> = {
  model: 'Model',
  actor: 'Actor',
  voiceover: 'Voiceover',
  extra: 'Extra',
}

const TYPE_OPTIONS: Array<{ value: CategoryFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'model', label: 'Models' },
  { value: 'actor', label: 'Actors' },
  { value: 'voiceover', label: 'Voiceover' },
  { value: 'extra', label: 'Extras' },
]

const PAY_OPTIONS: Array<{ value: PaymentFilter; label: string }> = [
  { value: 'all', label: 'Any' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'hourly', label: 'Hourly' },
]

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'soonest', label: 'Soonest shoot' },
  { value: 'newest', label: 'Newly posted' },
  { value: 'rate-high', label: 'Highest rate' },
]

export function ShootsContent() {
  const [query, setQuery] = useState('')
  // Debounce the free-text query so re-filtering doesn't fire on every
  // keystroke. (Audit M15.)
  const debouncedQuery = useDebouncedValue(query, 250)
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [city, setCity] = useState<string>('all')
  const [payment, setPayment] = useState<PaymentFilter>('all')
  const [sort, setSort] = useState<SortKey>('soonest')

  const cities = useMemo(() => {
    const set = new Set<string>()
    for (const s of MOCK_SHOOTS) set.add(s.locationCity)
    return Array.from(set).sort()
  }, [])

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    const matched = MOCK_SHOOTS.filter((s) => {
      if (category !== 'all' && s.category !== category) return false
      if (city !== 'all' && s.locationCity !== city) return false
      if (payment !== 'all' && s.paymentType !== payment) return false
      if (!q) return true
      const hay =
        `${s.title} ${s.description} ${s.caster.companyName} ${s.skillsRequired.join(' ')}`.toLowerCase()
      return hay.includes(q)
    })
    const sorted = [...matched]
    if (sort === 'soonest') {
      sorted.sort((a, b) => new Date(a.shootDate).getTime() - new Date(b.shootDate).getTime())
    } else if (sort === 'newest') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else if (sort === 'rate-high') {
      sorted.sort((a, b) => (b.rateAmount ?? 0) - (a.rateAmount ?? 0))
    }
    return sorted
  }, [debouncedQuery, category, city, payment, sort])

  const featured = MOCK_SHOOTS[0]!
  const reset = () => {
    setQuery('')
    setCategory('all')
    setCity('all')
    setPayment('all')
  }

  return (
    <>
      <Hero count={MOCK_SHOOTS.length} featured={featured} />

      <section className="border-y border-border/60 bg-background">
        <div className="mx-auto w-full max-w-[90rem] px-6 py-4 lg:px-8">
          <FilterBar
            query={query}
            onQuery={setQuery}
            category={category}
            onCategory={setCategory}
            city={city}
            onCity={setCity}
            cities={cities}
            payment={payment}
            onPayment={setPayment}
            sort={sort}
            onSort={setSort}
          />
        </div>
      </section>

      <section className="w-full pb-20 pt-12 lg:pb-28 lg:pt-16">
        <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/60">
              <NumberTicker value={filtered.length} className="text-foreground" />{' '}
              {filtered.length === 1 ? 'shoot' : 'shoots'} · sorted by{' '}
              {SORT_OPTIONS.find((o) => o.value === sort)?.label.toLowerCase()}
            </p>
            <Link
              href="/login?redirect=/shoots"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              Sign in to bid
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
              {filtered.map((shoot, i) => (
                <Reveal key={shoot.id} delay={Math.min(i * 40, 200)}>
                  <ShootCard shoot={shoot} />
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

function Hero({ count, featured }: { count: number; featured: PublicJob }) {
  const shootDate = new Date(featured.shootDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
  })
  const rateLabel = formatRate(featured)

  return (
    <section className="relative w-full overflow-hidden pb-16 pt-16 lg:pb-24 lg:pt-24">
      <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left: copy */}
          <Reveal className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-[var(--surface-50)] px-4 py-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em]">
                Live shoots · updated minutes ago
              </span>
            </div>

            <h1 className="mt-6 max-w-3xl text-balance text-5xl font-medium leading-[1.02] tracking-[-0.025em] text-foreground sm:text-6xl lg:text-7xl">
              <NumberTicker value={count} className="text-foreground" /> live{' '}
              <span className="font-serif font-normal italic">briefs</span> looking to cast{' '}
              <span className="font-serif font-normal italic">right now.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-foreground/75">
              Posted in the last seven days by verified UK casters and brands. Filter by city, type,
              and rate. Sign in to bid.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-foreground/70">
              <Tag>Across 6 UK cities</Tag>
              <Tag>£22/hr – £2,200</Tag>
              <Tag>ID-verified casters only</Tag>
            </div>
          </Reveal>

          {/* Right: featured shoot card */}
          <Reveal delay={120} className="lg:col-span-5">
            <Link
              href={`/shoots/${featured.id}`}
              className="group relative block overflow-hidden rounded-3xl border border-border/60 bg-background shadow-sm"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={featured.imageUrl}
                  alt={featured.title}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  priority
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"
                  aria-hidden
                />
                <div className="absolute left-5 top-5 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Featured · today
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
                    {CATEGORY_LABEL[featured.category]}
                    {featured.subcategory ? ` · ${featured.subcategory}` : ''}
                  </p>
                  <h2 className="mt-2 text-balance font-serif text-3xl leading-[1.1] tracking-[-0.01em]">
                    {featured.title}
                  </h2>
                  <p className="mt-3 text-sm font-medium text-white/85">
                    {featured.caster.companyName}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-border/60 bg-background">
                <HeroMeta label="Rate" value={rateLabel} accent />
                <HeroMeta label="When" value={shootDate} />
                <HeroMeta label="Where" value={featured.locationCity} />
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
  category,
  onCategory,
  city,
  onCity,
  cities,
  payment,
  onPayment,
  sort,
  onSort,
}: {
  query: string
  onQuery: (v: string) => void
  category: CategoryFilter
  onCategory: (v: CategoryFilter) => void
  city: string
  onCity: (v: string) => void
  cities: string[]
  payment: PaymentFilter
  onPayment: (v: PaymentFilter) => void
  sort: SortKey
  onSort: (v: SortKey) => void
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      {/* Search */}
      <div className="relative flex-1 lg:max-w-md">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search brief, brand, or skill"
          className="h-11 rounded-full border-border/60 bg-[var(--surface-50)] pl-10 text-sm focus-visible:bg-background"
        />
      </div>

      {/* Scroll-row of pill filters on mobile, inline on lg */}
      <div className="-mx-6 flex items-center gap-3 overflow-x-auto px-6 pb-1 lg:mx-0 lg:flex-1 lg:overflow-visible lg:px-0 lg:pb-0">
        <PillSelect
          icon={SlidersHorizontal}
          value={category}
          onChange={(v) => onCategory(v as CategoryFilter)}
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
          value={payment}
          onChange={(v) => onPayment(v as PaymentFilter)}
          options={PAY_OPTIONS}
        />
        <div className="ml-auto flex-none">
          <PillSelect
            value={sort}
            onChange={(v) => onSort(v as SortKey)}
            options={SORT_OPTIONS}
            align="right"
          />
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
  align = 'left',
}: {
  icon?: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
  align?: 'left' | 'right'
}) {
  const current = options.find((o) => o.value === value)?.label ?? value
  return (
    <label
      className={cn(
        'group relative inline-flex h-11 flex-none cursor-pointer items-center gap-2 rounded-full border border-border/60 bg-[var(--surface-50)] pl-4 pr-9 text-sm font-medium text-foreground transition-colors hover:border-foreground/40 hover:bg-background',
        value !== 'all' &&
          value !== 'soonest' &&
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
        className={cn(
          'absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0',
          align === 'right' && 'text-right'
        )}
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

function ShootCard({ shoot }: { shoot: PublicJob }) {
  const remaining = Math.max(shoot.headcountRequired - shoot.headcountFilled, 0)
  const rateLabel = formatRate(shoot)
  const shootWhen = formatShootDate(shoot.shootDate, shoot.shootEndDate)

  return (
    <Link href={`/shoots/${shoot.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[var(--surface-50)]">
        <Image
          src={shoot.imageUrl}
          alt={shoot.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"
          aria-hidden
        />

        {/* Top-left: category pill */}
        <div className="absolute left-4 top-4 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground backdrop-blur">
            {CATEGORY_LABEL[shoot.category]}
            {shoot.subcategory ? ` · ${shoot.subcategory}` : ''}
          </span>
        </div>

        {/* Top-right: NDA */}
        {shoot.requiresNda && (
          <div className="absolute right-4 top-4">
            <span className="inline-flex items-center rounded-full bg-amber-400/95 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-950">
              NDA
            </span>
          </div>
        )}

        {/* Bottom: rate + spots */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white">
          <p className="font-mono text-2xl font-medium tracking-[-0.02em]">{rateLabel}</p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
            <Users className="h-3 w-3" aria-hidden />
            {remaining} {remaining === 1 ? 'spot' : 'spots'}
          </span>
        </div>
      </div>

      <div className="mt-5 px-1">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
          {shoot.caster.companyName}
        </p>
        <h3 className="mt-2 text-lg font-medium leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-foreground/85">
          {shoot.title}
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-foreground/65">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-foreground/40" aria-hidden />
            {shoot.locationCity}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-foreground/40" aria-hidden />
            {shootWhen}
          </span>
        </div>
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
      <h3 className="mt-5 font-serif text-2xl text-foreground">No shoots match those filters.</h3>
      <p className="mt-2 max-w-md text-sm text-foreground/70">
        Try widening the city, switching pay type, or clearing the search query.
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
              Bid on shoots
            </p>
            <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
              Get on the platform —{' '}
              <span className="font-serif font-normal italic">then bid in seconds.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-background/70">
              Apply once, get verified, then submit a bid on any open shoot with a rate and cover
              note in under a minute.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-background text-foreground hover:bg-background/90"
              >
                <Link href="/register?role=artist">
                  Apply to bid
                  <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
              >
                <Link href="/artists">For artists</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function formatRate(shoot: PublicJob): string {
  if (shoot.rateSetBy === 'open' || shoot.rateAmount == null) {
    return 'Open to bids'
  }
  if (shoot.paymentType === 'hourly') {
    return `${formatCurrency(shoot.rateAmount)}/hr`
  }
  return `${formatCurrency(shoot.rateAmount)}`
}

function formatShootDate(start: string, end: string | null): string {
  const d = new Date(start)
  const fmt = (date: Date) =>
    date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    })
  if (!end) return fmt(d)
  const e = new Date(end)
  if (fmt(d) === fmt(e)) return fmt(d)
  return `${fmt(d)} → ${fmt(e)}`
}
