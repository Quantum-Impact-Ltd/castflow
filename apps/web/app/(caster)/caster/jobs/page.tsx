'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Briefcase,
  CalendarDays,
  Users,
  Pencil,
  Eye,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react'
import type { JobStatus } from '@castflow/types'
import {
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
} from '@/components/dashboard'
import { rateLabel } from '@/components/dashboard/job-card'
import type { JobWithCounts } from '@/lib/api/jobs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useMyJobs, useCancelJob } from '@/lib/hooks/use-jobs'
import { formatDate } from '@/lib/utils'

type TabValue = 'active' | 'filled' | 'expired' | 'cancelled' | 'all'

const TABS: { value: TabValue; label: string; match: (s: JobStatus) => boolean }[] = [
  { value: 'active', label: 'Active', match: (s) => s === 'active' || s === 'draft' },
  { value: 'filled', label: 'Filled', match: (s) => s === 'filled' },
  // "closed" counts as Expired per spec.
  { value: 'expired', label: 'Expired', match: (s) => s === 'expired' || s === 'closed' },
  { value: 'cancelled', label: 'Cancelled', match: (s) => s === 'cancelled' },
  { value: 'all', label: 'All', match: () => true },
]

export default function CasterJobsPage() {
  const { data, isPending, isError, refetch } = useMyJobs({ limit: 100 })

  return (
    <div className="space-y-6">
      <PageHeader
        title="My jobs"
        description="Every shoot you’ve posted, grouped by status."
        actions={
          <Button asChild>
            <Link href="/caster/jobs/new">
              <Plus className="mr-1.5 h-4 w-4" /> Post a job
            </Link>
          </Button>
        }
      />

      {isPending ? (
        <LoadingState rows={4} />
      ) : isError ? (
        <ErrorState message="We couldn’t load your jobs." onRetry={() => void refetch()} />
      ) : (
        <Tabs defaultValue="active">
          <TabsList className="flex-wrap">
            {TABS.map((t) => {
              const count = (data ?? []).filter((j) => t.match(j.status)).length
              return (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                  <span className="ml-1.5 text-xs text-muted-foreground">{count}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {TABS.map((t) => {
            const jobs = (data ?? []).filter((j) => t.match(j.status))
            return (
              <TabsContent key={t.value} value={t.value} className="mt-4">
                {jobs.length === 0 ? (
                  <EmptyState
                    title={`No ${t.value === 'all' ? '' : t.label.toLowerCase() + ' '}jobs`}
                    description={
                      t.value === 'active'
                        ? 'Post a job to start receiving bids from talent.'
                        : 'Nothing here yet.'
                    }
                    icon={<Briefcase className="h-6 w-6" />}
                    action={
                      t.value === 'active' ? (
                        <Button asChild size="sm">
                          <Link href="/caster/jobs/new">Post a job</Link>
                        </Button>
                      ) : undefined
                    }
                  />
                ) : (
                  <ul className="space-y-3">
                    {jobs.map((job) => (
                      <li key={job.id}>
                        <JobRow job={job} />
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      )}
    </div>
  )
}

function JobRow({ job }: { job: JobWithCounts }) {
  const bidCount = job._count?.bids ?? 0
  const spotsRemaining = Math.max(job.headcountRequired - job.headcountFilled, 0)
  const closable = job.status === 'active' || job.status === 'draft'

  return (
    <Card className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/caster/jobs/${job.id}`}
            className="truncate font-medium text-foreground hover:underline"
          >
            {job.title}
          </Link>
          <span className="text-xs capitalize text-muted-foreground">{job.category}</span>
          <StatusBadge status={job.status} />
        </div>
        <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" /> {formatDate(job.shootDate)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> {spotsRemaining}{' '}
            {spotsRemaining === 1 ? 'spot' : 'spots'} remaining
          </span>
          <span>
            {bidCount} {bidCount === 1 ? 'bid' : 'bids'}
          </span>
          <span>Apply by {formatDate(job.applicationDeadline)}</span>
          <span className="font-medium text-foreground">{rateLabel(job)}</span>
        </dl>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/caster/jobs/${job.id}/bids`}>
            <Eye className="mr-1.5 h-3.5 w-3.5" /> View bids
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/caster/jobs/${job.id}/edit`}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
          </Link>
        </Button>
        {closable ? <CancelJobDialog jobId={job.id} title={job.title} bidCount={bidCount} /> : null}
      </div>
    </Card>
  )
}

function CancelJobDialog({
  jobId,
  title,
  bidCount,
}: {
  jobId: string
  title: string
  bidCount: number
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const cancel = useCancelJob(jobId)
  // With no bids the action is framed as a delete; with bids it's a close.
  const isDelete = bidCount === 0
  const valid = reason.trim().length >= 3

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          {isDelete ? (
            <>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
            </>
          ) : (
            <>
              <XCircle className="mr-1.5 h-3.5 w-3.5" /> Close
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isDelete ? 'Delete this job?' : 'Close this job?'}</DialogTitle>
          <DialogDescription>
            {isDelete
              ? `“${title}” has no bids and will be removed. This can’t be undone.`
              : `“${title}” will be closed to new bids. Existing bidders will be notified. This can’t be undone.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="cancel-reason">Reason</Label>
          <Textarea
            id="cancel-reason"
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
            {cancel.isPending
              ? isDelete
                ? 'Deleting…'
                : 'Closing…'
              : isDelete
                ? 'Delete job'
                : 'Close job'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
