'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  CalendarDays,
  Clock,
  Users,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Pencil,
  XCircle,
} from 'lucide-react'
import { ApiError } from '@/lib/fetcher'
import {
  PageHeader,
  LoadingState,
  ErrorState,
  StatusBadge,
} from '@/components/dashboard'
import { rateLabel } from '@/components/dashboard/job-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useJob, useCancelJob } from '@/lib/hooks/use-jobs'
import { useBidsForJob } from '@/lib/hooks/use-bids'
import { formatDate } from '@/lib/utils'

export function CasterJobDetailClient({ jobId }: { jobId: string }) {
  const { data: job, isPending, isError, error, refetch } = useJob(jobId)
  const bids = useBidsForJob(jobId)

  if (isPending) return <LoadingState variant="detail" />

  if (isError) {
    const status = error instanceof ApiError ? error.status : 0
    if (status === 404 || status === 410) {
      return (
        <div className="space-y-4">
          <BackLink />
          <ErrorState
            title="This job is no longer available"
            message="It may have been removed or no longer exists."
          />
        </div>
      )
    }
    return <ErrorState onRetry={() => void refetch()} />
  }

  const bidCount = bids.data?.length ?? 0
  const spotsRemaining = Math.max(job.headcountRequired - job.headcountFilled, 0)
  const closable = job.status === 'active' || job.status === 'draft'

  return (
    <div className="space-y-6">
      <BackLink />

      <PageHeader
        title={job.title}
        description={`Posted ${formatDate(job.createdAt)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild>
              <Link href={`/caster/jobs/${job.id}/bids`}>
                View bids
                {bidCount > 0 ? (
                  <span className="ml-1.5 rounded-full bg-primary-foreground/20 px-1.5 text-xs">
                    {bidCount}
                  </span>
                ) : null}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/caster/jobs/${job.id}/edit`}>
                <Pencil className="mr-1.5 h-4 w-4" /> Edit
              </Link>
            </Button>
            {closable ? <CloseJobDialog jobId={job.id} title={job.title} /> : null}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="capitalize">
          {job.category}
        </Badge>
        {job.subcategory ? <Badge variant="outline">{job.subcategory}</Badge> : null}
        <StatusBadge status={job.status} />
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
              <Detail label="Headcount" value={`${job.headcountFilled} / ${job.headcountRequired}`} />
              {job.skillsRequired.length > 0 ? (
                <div className="sm:col-span-2">
                  <Detail label="Skills" value={job.skillsRequired.join(', ')} />
                </div>
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
              <IconRow icon={MapPin} label="City" value={job.locationCity} />
              <IconRow icon={Users} label="Spots remaining" value={String(spotsRemaining)} />
              <IconRow
                icon={CalendarDays}
                label="Apply by"
                value={formatDate(job.applicationDeadline)}
              />
              <IconRow
                icon={MessageSquare}
                label="Bids received"
                value={bids.isPending ? '—' : String(bidCount)}
              />
            </ul>
          </Card>

          {job.requiresNda || job.exclusivity ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              This shoot has {job.requiresNda ? 'an NDA' : ''}
              {job.requiresNda && job.exclusivity ? ' and ' : ''}
              {job.exclusivity ? 'an exclusivity clause' : ''}. Artists agree to these in the
              contract.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function CloseJobDialog({ jobId, title }: { jobId: string; title: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const cancel = useCancelJob(jobId)
  const valid = reason.trim().length >= 3

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-destructive hover:text-destructive">
          <XCircle className="mr-1.5 h-4 w-4" /> Close job
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close this job?</DialogTitle>
          <DialogDescription>
            “{title}” will be closed to new bids. Existing bidders will be notified. This can’t be
            undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="close-reason">Reason</Label>
          <Textarea
            id="close-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="A short reason (shared with any existing bidders)."
          />
          {!valid && reason.length > 0 ? (
            <p className="text-xs text-destructive">Please give at least 3 characters.</p>
          ) : null}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Keep job</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={!valid || cancel.isPending}
            onClick={() =>
              cancel.mutate(reason.trim(), {
                onSuccess: () => {
                  setOpen(false)
                  setReason('')
                },
              })
            }
          >
            {cancel.isPending ? 'Closing…' : 'Close job'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BackLink() {
  return (
    <Link
      href="/caster/jobs"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" /> Back to my jobs
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
