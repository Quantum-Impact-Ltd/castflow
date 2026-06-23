'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Mail, Search, X } from 'lucide-react'
import type { BidStatus, JobCategory } from '@castflow/types'
import {
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
} from '@/components/dashboard'
import { JobCard } from '@/components/dashboard/job-card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePublicJobs } from '@/lib/hooks/use-jobs'
import { useMyBids } from '@/lib/hooks/use-bids'
import { useMyInvites } from '@/lib/hooks/use-invites'
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value'

const CATEGORIES: { value: JobCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All categories' },
  { value: 'model', label: 'Model' },
  { value: 'actor', label: 'Actor' },
  { value: 'voiceover', label: 'Voiceover' },
  { value: 'extra', label: 'Extra' },
]

export default function ArtistJobFeedPage() {
  const [city, setCity] = useState('')
  const [category, setCategory] = useState<JobCategory | 'all'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [rateMin, setRateMin] = useState('')
  const [rateMax, setRateMax] = useState('')
  const [hideApplied, setHideApplied] = useState(false)

  const debouncedCity = useDebouncedValue(city, 250)

  const { data, isPending, isError, refetch } = usePublicJobs({
    ...(debouncedCity ? { city: debouncedCity } : {}),
    ...(category !== 'all' ? { category } : {}),
  })

  // The artist's own bids + pending invites layer personalised signals over the
  // shared public feed. Both are non-blocking: if either fails or is still
  // loading, the feed still renders (just without the badges / invited rail).
  const { data: myBids } = useMyBids()
  const { data: invites } = useMyInvites({ status: 'pending' })

  // jobId → the artist's bid on that job (status + id for the "view bid" link).
  const bidByJob = useMemo(() => {
    const map = new Map<string, { status: BidStatus; bidId: string }>()
    for (const bid of myBids ?? []) map.set(bid.jobId, { status: bid.status, bidId: bid.id })
    return map
  }, [myBids])

  // Pending invites carry their full job — these are usually invite-only jobs
  // that never appear in the public feed, so surface them in their own rail.
  const invitedJobs = useMemo(
    () => (invites ?? []).flatMap((inv) => (inv.job ? [{ invite: inv, job: inv.job }] : [])),
    [invites]
  )
  const invitedJobIds = useMemo(() => new Set(invitedJobs.map((i) => i.job.id)), [invitedJobs])

  // Date-range and rate-range facets aren't supported server-side, so apply
  // them client-side over the returned page. (Open-to-bids jobs have no rate
  // and are kept regardless of the rate filter.)
  const jobs = useMemo(() => {
    const list = data ?? []
    const from = dateFrom ? new Date(dateFrom).getTime() : null
    const to = dateTo ? new Date(dateTo).getTime() : null
    const min = rateMin ? Number(rateMin) : null
    const max = rateMax ? Number(rateMax) : null
    return list.filter((job) => {
      // Invited jobs are shown in their own rail above — don't double-list.
      if (invitedJobIds.has(job.id)) return false
      // "Hide jobs I've bid on" ignores withdrawn bids — those are re-biddable.
      if (hideApplied) {
        const b = bidByJob.get(job.id)
        if (b && b.status !== 'withdrawn') return false
      }
      const shoot = new Date(job.shootDate).getTime()
      if (from !== null && shoot < from) return false
      if (to !== null && shoot > to) return false
      if (job.rateAmount !== null) {
        if (min !== null && job.rateAmount < min) return false
        if (max !== null && job.rateAmount > max) return false
      }
      return true
    })
  }, [data, dateFrom, dateTo, rateMin, rateMax, hideApplied, bidByJob, invitedJobIds])

  // Renders the contextual CTA + bid-status badge for a feed card.
  const cardProps = (jobId: string) => {
    const bid = bidByJob.get(jobId)
    // A withdrawn bid frees the artist to apply again while the job is open.
    if (bid && bid.status === 'withdrawn') {
      return {
        badge: <StatusBadge status="withdrawn" />,
        action: (
          <Button asChild size="sm" className="w-full">
            <Link href={`/artist/jobs/${jobId}/bid`}>Bid again</Link>
          </Button>
        ),
      }
    }
    if (bid) {
      return {
        badge: <StatusBadge status={bid.status} />,
        action: (
          <Button asChild size="sm" variant="outline" className="w-full">
            <Link href={`/artist/bids/${bid.bidId}`}>View your bid</Link>
          </Button>
        ),
      }
    }
    return {
      action: (
        <Button asChild size="sm" className="w-full">
          <Link href={`/artist/jobs/${jobId}/bid`}>Bid now</Link>
        </Button>
      ),
    }
  }

  const hasClientFilters = Boolean(dateFrom || dateTo || rateMin || rateMax || hideApplied)
  const clearAll = () => {
    setCity('')
    setCategory('all')
    setDateFrom('')
    setDateTo('')
    setRateMin('')
    setRateMax('')
    setHideApplied(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Job feed" description="Active shoots open for bids." />

      <div className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="city"
              placeholder="Any city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as JobCategory | 'all')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Shoot date range</Label>
          <div className="flex items-center gap-2">
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <span className="text-muted-foreground">–</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Rate range (£)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Min"
              value={rateMin}
              onChange={(e) => setRateMin(e.target.value)}
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Max"
              value={rateMax}
              onChange={(e) => setRateMax(e.target.value)}
            />
          </div>
        </div>
      </div>

      {invitedJobs.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium text-foreground">
              Invited to apply ({invitedJobs.length})
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {invitedJobs.map(({ job }) => (
              <JobCard
                key={job.id}
                job={job}
                href={`/artist/jobs/${job.id}`}
                badge={
                  <StatusBadge
                    status="pending"
                    label="Invited"
                    className="border-primary/30 bg-[var(--brand-50)] text-[var(--brand-700)]"
                  />
                }
                {...cardProps(job.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {isPending ? (
        <LoadingState variant="grid" rows={6} />
      ) : isError ? (
        <ErrorState message="We couldn’t load the job feed." onRetry={() => void refetch()} />
      ) : jobs.length > 0 ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
              {hasClientFilters ? ' after filters' : ''}
            </p>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={hideApplied}
                onChange={(e) => setHideApplied(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-[var(--brand-600)]"
              />
              Hide jobs I’ve bid on
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                href={`/artist/jobs/${job.id}`}
                {...cardProps(job.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="No matching jobs"
          description="Try widening your filters — new shoots are posted daily."
          icon={<Search className="h-6 w-6" />}
          action={
            (debouncedCity || category !== 'all' || hasClientFilters) && (
              <Button variant="outline" size="sm" onClick={clearAll}>
                <X className="mr-1.5 h-4 w-4" /> Clear filters
              </Button>
            )
          }
        />
      )}
    </div>
  )
}
