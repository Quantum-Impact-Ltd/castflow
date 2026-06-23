'use client'

import Link from 'next/link'
import { Building2, MapPin, Star, ExternalLink, Calendar, Briefcase } from 'lucide-react'
import { usePublicCaster } from '@/lib/hooks/use-caster'
import { RemoteImage } from '@/components/dashboard/remote-image'
import { cn, formatCurrency, formatDate, formatRating } from '@/lib/utils'

const COMPANY_TYPE_LABEL: Record<string, string> = {
  brand: 'Brand',
  agency: 'Agency',
  production_house: 'Production house',
  independent: 'Independent',
}

export function CasterProfileView({ id }: { id: string }) {
  const { data, isPending, isError } = usePublicCaster(id)

  // pt-28 clears the floating CardNav (fixed at top:1.25rem, 60px tall).
  if (isPending) {
    return (
      <div className="mx-auto max-w-5xl px-6 pb-16 pt-28">
        <div className="h-48 animate-pulse rounded-3xl bg-[var(--surface-50)]" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-5xl px-6 pb-24 pt-32 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Company not found</h1>
        <p className="mt-2 text-sm text-foreground/60">
          This company profile may have been removed or never existed.
        </p>
        <Link href="/shoots" className="mt-6 inline-block text-sm font-medium text-primary">
          Browse open shoots →
        </Link>
      </div>
    )
  }

  const memberSince = new Date(data.createdAt).getFullYear()
  const openCount = data.activeJobs.length

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-6 pb-20 pt-28">
      {/* Header card */}
      <header className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="h-24 bg-gradient-to-r from-[var(--brand-700)]/12 via-[var(--brand-500)]/8 to-transparent" />
        <div className="flex flex-col gap-6 px-6 pb-6 sm:flex-row sm:items-end sm:px-8">
          <div className="relative -mt-12 h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {data.logoUrl ? (
              <RemoteImage
                src={data.logoUrl}
                alt={data.companyName}
                fill
                sizes="112px"
                className="object-contain p-2"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-[var(--surface-50)] text-foreground/40">
                <Building2 className="h-9 w-9" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                {data.companyName}
              </h1>
              <span className="rounded-full bg-[var(--surface-50)] px-3 py-1 text-xs font-medium text-foreground/70">
                {COMPANY_TYPE_LABEL[data.companyType] ?? data.companyType}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-foreground/60">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> On CastFlow since {memberSince}
              </span>
              {data.website ? (
                <a
                  href={data.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  Website <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
          <Stat
            icon={<Briefcase className="h-4 w-4" />}
            value={String(data.jobsPosted)}
            label={data.jobsPosted === 1 ? 'shoot posted' : 'shoots posted'}
          />
          <Stat
            icon={<MapPin className="h-4 w-4" />}
            value={String(openCount)}
            label={openCount === 1 ? 'open shoot' : 'open shoots'}
          />
          <Stat
            icon={<Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
            value={data.ratingCount > 0 ? formatRating(data.ratingAvg) : '—'}
            label={
              data.ratingCount > 0
                ? `from ${data.ratingCount} ${data.ratingCount === 1 ? 'artist' : 'artists'}`
                : 'no reviews yet'
            }
          />
        </div>
      </header>

      {/* Open shoots */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-foreground">Open shoots</h2>
          {openCount > 0 ? (
            <span className="text-sm text-foreground/50">
              {openCount} accepting {openCount === 1 ? 'bid' : 'bids'}
            </span>
          ) : null}
        </div>
        {openCount === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 bg-[var(--surface-50)] p-8 text-center text-sm text-foreground/60">
            No open shoots right now. Check back soon.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {data.activeJobs.map((job) => {
              const spots = Math.max(job.headcountRequired - job.headcountFilled, 0)
              const rate =
                job.rateSetBy === 'open'
                  ? 'Open to proposals'
                  : job.rateAmount !== null
                    ? `${formatCurrency(job.rateAmount)}${job.paymentType === 'hourly' ? '/hr' : ''}`
                    : '—'
              return (
                <li key={job.id}>
                  <Link
                    href={`/shoots/${job.id}`}
                    className="block overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40"
                  >
                    <div className="relative aspect-[16/9] bg-[var(--surface-50)]">
                      {job.coverImageUrl ? (
                        <RemoteImage
                          src={job.coverImageUrl}
                          alt={job.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 400px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs uppercase tracking-widest text-foreground/30">
                          {job.category}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 p-4">
                      <p className="font-medium text-foreground">{job.title}</p>
                      <p className="flex items-center gap-1.5 text-xs text-foreground/60">
                        <MapPin className="h-3 w-3" /> {job.locationCity} ·{' '}
                        {formatDate(job.shootDate)}
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {rate}
                        <span className="ml-2 text-xs font-normal text-foreground/50">
                          {spots} {spots === 1 ? 'spot' : 'spots'} left
                        </span>
                      </p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Reviews from artists */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">What artists say</h2>
        {data.reviews.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 bg-[var(--surface-50)] p-8 text-center text-sm text-foreground/60">
            No reviews yet — artists can review this company after completing a shoot together.
          </p>
        ) : (
          <ul className="space-y-4">
            {data.reviews.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-border/60 bg-[var(--surface-50)] p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'h-3.5 w-3.5',
                          i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-foreground/20'
                        )}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/50">
                    {formatDate(r.createdAt)}
                  </span>
                </div>
                {r.comment ? (
                  <p className="mt-3 text-sm leading-relaxed text-foreground/80">{r.comment}</p>
                ) : null}
                {r.booking?.job?.title ? (
                  <p className="mt-3 text-xs text-foreground/55">
                    On <span className="font-medium text-foreground/70">{r.booking.job.title}</span>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-5 text-center">
      <span className="flex items-center gap-1.5 text-2xl font-semibold tracking-tight text-foreground">
        <span className="text-foreground/40">{icon}</span>
        {value}
      </span>
      <span className="text-xs text-foreground/55">{label}</span>
    </div>
  )
}
