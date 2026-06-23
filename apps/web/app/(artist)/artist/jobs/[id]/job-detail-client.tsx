'use client'

import Link from 'next/link'
import {
  ChevronLeft,
  CalendarDays,
  Clock,
  Users,
  ShieldCheck,
  FileLock2,
  Bookmark,
  Building2,
} from 'lucide-react'
import { ApiError } from '@/lib/fetcher'
import {
  PageHeader,
  LoadingState,
  ErrorState,
  LockedField,
  StatusBadge,
} from '@/components/dashboard'
import { rateLabel } from '@/components/dashboard/job-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useJob } from '@/lib/hooks/use-jobs'
import { useMyBids } from '@/lib/hooks/use-bids'
import { useSavedJobs } from '@/lib/hooks/use-saved-jobs'
import { formatDate, cn } from '@/lib/utils'

export function ArtistJobDetailClient({ jobId }: { jobId: string }) {
  const { data: job, isPending, isError, error, refetch } = useJob(jobId)
  const myBids = useMyBids({})
  const { isSaved, toggle } = useSavedJobs()

  if (isPending) return <LoadingState variant="detail" />

  if (isError) {
    const status = error instanceof ApiError ? error.status : 0
    if (status === 404 || status === 410) {
      return (
        <div className="space-y-4">
          <BackLink />
          <ErrorState
            title="This job is no longer open"
            message="It may have been filled, expired, or removed."
          />
        </div>
      )
    }
    return <ErrorState onRetry={() => void refetch()} />
  }

  const existingBid = (myBids.data ?? []).find((b) => b.jobId === job.id)
  const spotsRemaining = Math.max(job.headcountRequired - job.headcountFilled, 0)
  const deadlinePassed = new Date(job.applicationDeadline).getTime() < Date.now()
  const closed = job.status !== 'active' || spotsRemaining === 0 || deadlinePassed
  const saved = isSaved(job.id)

  return (
    <div className="space-y-6">
      <BackLink />

      <PageHeader
        title={job.title}
        description={job.caster?.companyName ?? 'CastFlow caster'}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label={saved ? 'Remove from saved' : 'Save job'}
              onClick={() => toggle(job.id)}
            >
              <Bookmark className={cn('h-4 w-4', saved && 'fill-primary text-primary')} />
            </Button>
            {existingBid ? (
              <Button asChild>
                <Link href={`/artist/bids/${existingBid.id}`}>View your bid</Link>
              </Button>
            ) : closed ? (
              <Button disabled>Closed for bids</Button>
            ) : (
              <Button asChild>
                <Link href={`/artist/jobs/${job.id}/bid`}>Submit a bid</Link>
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="capitalize">
          {job.category}
        </Badge>
        {job.subcategory ? <Badge variant="outline">{job.subcategory}</Badge> : null}
        <StatusBadge status={job.status} />
        {existingBid ? (
          <StatusBadge status={existingBid.status} label={`Your bid: ${existingBid.status}`} />
        ) : null}
        {job.casterId ? (
          <Link
            href={`/casters/${job.casterId}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Building2 className="h-3.5 w-3.5" /> View {job.caster?.companyName ?? 'company'}{' '}
            profile
          </Link>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-3 p-6">
            <h2 className="text-sm font-semibold text-foreground">About this shoot</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {job.description}
            </p>
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="text-sm font-semibold text-foreground">Requirements</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Gender" value={titleCase(job.genderRequired)} />
              <Detail
                label="Age range"
                value={
                  job.ageMin || job.ageMax ? `${job.ageMin ?? '18'}–${job.ageMax ?? 'any'}` : 'Any'
                }
              />
              <Detail label="Location" value={job.locationCity} />
              {job.skillsRequired.length > 0 ? (
                <Detail label="Skills" value={job.skillsRequired.join(', ')} />
              ) : null}
            </dl>
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="text-sm font-semibold text-foreground">Legal &amp; usage</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="NDA required" value={job.requiresNda ? 'Yes' : 'No'} />
              <Detail label="Exclusivity" value={job.exclusivity ? 'Yes' : 'No'} />
              <div className="sm:col-span-2">
                <Detail label="Usage rights" value={job.usageRights} />
              </div>
            </dl>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-4 p-6">
            <p className="text-2xl font-semibold text-foreground">{rateLabel(job)}</p>
            <Separator />
            <ul className="space-y-3 text-sm">
              <IconRow icon={CalendarDays} label="Shoot date" value={formatDate(job.shootDate)} />
              <IconRow icon={Clock} label="Duration" value={`${job.shootDurationHours} hrs`} />
              <IconRow icon={Users} label="Spots remaining" value={String(spotsRemaining)} />
              <IconRow
                icon={CalendarDays}
                label="Apply by"
                value={formatDate(job.applicationDeadline)}
              />
            </ul>
          </Card>

          <Card className="space-y-2 p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileLock2 className="h-4 w-4" /> Shoot location
            </div>
            <LockedField reason="Revealed once the contract is fully signed" />
          </Card>

          {job.requiresNda || job.exclusivity ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              This shoot has {job.requiresNda ? 'an NDA' : ''}
              {job.requiresNda && job.exclusivity ? ' and ' : ''}
              {job.exclusivity ? 'an exclusivity clause' : ''}. You’ll agree to these in the
              contract.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/artist/jobs"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" /> Back to job feed
    </Link>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  )
}

function IconRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays
  label: string
  value: string
}) {
  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <span className="font-medium text-foreground">{value}</span>
    </li>
  )
}

function titleCase(s: string): string {
  return s.replace(/(^|_)([a-z])/g, (_, _sep: string, c: string) => ` ${c.toUpperCase()}`).trim()
}
