'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  CalendarDays,
  Clock,
  Users,
  MapPin,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { ApiError } from '@/lib/fetcher'
import { PageHeader, LoadingState, ErrorState, StatusBadge, Money } from '@/components/dashboard'
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
import { useAdminJob, useRemoveJob } from '@/lib/hooks/use-admin'
import { formatDate } from '@/lib/utils'

export function AdminJobDetailClient({ jobId }: { jobId: string }) {
  const { data: job, isPending, isError, error, refetch } = useAdminJob(jobId)

  if (isPending) return <LoadingState variant="detail" />

  if (isError) {
    const status = error instanceof ApiError ? error.status : 0
    if (status === 404 || status === 410) {
      return (
        <div className="space-y-4">
          <BackLink />
          <ErrorState
            title="Job not found"
            message="This job may have been removed or no longer exists."
          />
        </div>
      )
    }
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorState onRetry={() => void refetch()} />
      </div>
    )
  }

  const removed = job.status === 'cancelled'
  const rate =
    job.rateAmount == null
      ? 'Open to proposals'
      : job.paymentType === 'hourly'
        ? `${job.rateAmount}/hr`
        : 'flat fee'

  return (
    <div className="space-y-6">
      <BackLink />

      <PageHeader
        title={job.title}
        description={`Posted ${formatDate(job.createdAt)} · Caster ${job.casterId}`}
        actions={removed ? <StatusBadge status={job.status} /> : <RemoveJobDialog jobId={job.id} title={job.title} />}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="capitalize">
          {job.category}
        </Badge>
        {job.subcategory ? <Badge variant="outline">{job.subcategory}</Badge> : null}
        <StatusBadge status={job.status} />
        <Badge variant="outline" className="capitalize">
          {job.visibility?.replace('_', ' ')}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-3 p-6">
            <h2 className="text-sm font-semibold text-foreground">Description</h2>
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
                  job.ageMin || job.ageMax ? `${job.ageMin ?? 'any'}–${job.ageMax ?? 'any'}` : 'Any'
                }
              />
              <Detail label="Location" value={job.locationCity} />
              <Detail
                label="Headcount"
                value={`${job.headcountFilled} / ${job.headcountRequired}`}
              />
              {job.skillsRequired?.length ? (
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
                <Detail label="Usage rights" value={job.usageRights || '—'} />
              </div>
            </dl>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-4 p-6">
            <p className="text-2xl font-semibold text-foreground">
              {job.rateAmount == null ? (
                'Open rate'
              ) : (
                <>
                  <Money amount={job.rateAmount} />
                  <span className="ml-1 text-base font-normal text-muted-foreground">
                    {job.paymentType === 'hourly' ? '/hr' : ''}
                  </span>
                </>
              )}
            </p>
            <p className="text-sm text-muted-foreground capitalize">
              {job.paymentType} · {rate} · set by {job.rateSetBy}
            </p>
            <Separator />
            <ul className="space-y-3 text-sm">
              <IconRow icon={CalendarDays} label="Shoot date" value={formatDate(job.shootDate)} />
              <IconRow icon={Clock} label="Duration" value={`${job.shootDurationHours} hrs`} />
              <IconRow icon={MapPin} label="City" value={job.locationCity} />
              <IconRow
                icon={Users}
                label="Headcount"
                value={`${job.headcountFilled} / ${job.headcountRequired}`}
              />
              <IconRow
                icon={CalendarDays}
                label="Apply by"
                value={formatDate(job.applicationDeadline)}
              />
              <IconRow icon={CalendarDays} label="Auto-expires" value={formatDate(job.autoExpiresAt)} />
            </ul>
          </Card>

          {removed ? (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              This job has been removed from the platform.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function RemoveJobDialog({ jobId, title }: { jobId: string; title: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const remove = useRemoveJob()
  const valid = reason.trim().length >= 5

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="mr-1.5 h-4 w-4" /> Remove from platform
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove this job?</DialogTitle>
          <DialogDescription>
            “{title}” will be removed from the platform. The caster and any active bidders will be
            notified. This action is permanently logged.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="remove-reason">Reason (required)</Label>
          <Textarea
            id="remove-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this job being removed? (at least 5 characters)"
            maxLength={500}
          />
          {!valid && reason.length > 0 ? (
            <p className="text-xs text-destructive">Please give at least 5 characters.</p>
          ) : null}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Keep job</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={!valid || remove.isPending}
            onClick={() =>
              remove.mutate(
                { id: jobId, reason: reason.trim() },
                {
                  onSuccess: () => {
                    setOpen(false)
                    router.push('/admin/jobs')
                  },
                }
              )
            }
          >
            {remove.isPending ? 'Removing…' : 'Remove job'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BackLink() {
  return (
    <Link
      href="/admin/jobs"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" /> Back to jobs
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
