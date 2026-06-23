'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Bookmark, MapPin, CalendarDays, Users } from 'lucide-react'
import type { Job } from '@castflow/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSavedJobs } from '@/lib/hooks/use-saved-jobs'
import { formatCurrency, formatDate, cn } from '@/lib/utils'

/** Human-readable rate label respecting payment type + open-to-bids. */
export function rateLabel(job: Pick<Job, 'rateSetBy' | 'paymentType' | 'rateAmount'>): string {
  if (job.rateSetBy === 'open' || job.rateAmount === null) return 'Open to Bids'
  return job.paymentType === 'hourly'
    ? `${formatCurrency(job.rateAmount)}/hr`
    : `${formatCurrency(job.rateAmount)} flat`
}

interface JobCardProps {
  job: Job
  href: string
  /** Show the bookmark toggle (artist feed / saved list). */
  showSave?: boolean
  /** Optional status pill rendered under the category row (e.g. the artist's
   *  bid status on this job). Non-interactive — safe inside the card link. */
  badge?: ReactNode
  /** Optional call-to-action rendered as a sibling BELOW the card link (so it
   *  is never nested inside an anchor). E.g. a "Bid now" / "View your bid"
   *  button on the artist feed. */
  action?: ReactNode
}

export function JobCard({ job, href, showSave = true, badge, action }: JobCardProps) {
  const { isSaved, toggle } = useSavedJobs()
  const saved = isSaved(job.id)
  const spotsRemaining = Math.max(job.headcountRequired - job.headcountFilled, 0)

  return (
    <div className="relative flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
      {showSave ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={saved ? 'Remove from saved' : 'Save job'}
          aria-pressed={saved}
          onClick={() => toggle(job.id)}
          className="absolute right-3 top-3 h-8 w-8 text-muted-foreground hover:text-primary"
        >
          <Bookmark className={cn('h-4 w-4', saved && 'fill-primary text-primary')} />
        </Button>
      ) : null}

      <Link href={href} className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 pr-8">
          <Badge variant="secondary" className="capitalize">
            {job.category}
          </Badge>
          {job.subcategory ? (
            <span className="text-xs text-muted-foreground">{job.subcategory}</span>
          ) : null}
          {badge}
        </div>

        <h3 className="line-clamp-2 pr-8 font-medium tracking-[-0.01em] text-foreground">
          {job.title}
        </h3>

        <dl className="mt-auto space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            {job.locationCity}
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(job.shootDate)}
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5" />
            {spotsRemaining} {spotsRemaining === 1 ? 'spot' : 'spots'} remaining
          </div>
        </dl>

        <p className="font-semibold text-foreground">{rateLabel(job)}</p>
      </Link>

      {action ? <div className="border-t border-border pt-3">{action}</div> : null}
    </div>
  )
}
