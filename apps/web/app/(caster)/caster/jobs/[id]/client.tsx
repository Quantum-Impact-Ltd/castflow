'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ErrorState, LoadingState, PageHeader, StatusBadge } from '@/components/dashboard'
import { useCancelJob, useJob } from '@/lib/hooks/use-jobs'
import { formatCurrency, formatDate } from '@/lib/utils'

export function CasterJobDetailClient({ id }: { id: string }) {
  const job = useJob(id)
  const cancel = useCancelJob(id)
  const [reason, setReason] = useState('')
  const [open, setOpen] = useState(false)

  if (job.isPending) return <LoadingState rows={6} />
  if (job.isError || !job.data) return <ErrorState onRetry={() => job.refetch()} />
  const j = job.data

  return (
    <div className="space-y-6">
      <PageHeader
        title={j.title}
        description={`${j.category} · ${j.locationCity} · Shoot ${formatDate(j.shootDate)}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/caster/jobs/${j.id}/bids`}>View bids</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/caster/jobs/${j.id}/edit`}>Edit</Link>
            </Button>
            {j.status === 'active' ? (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">Cancel job</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel this job?</DialogTitle>
                  </DialogHeader>
                  <Textarea
                    placeholder="Reason for cancelling"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Keep job
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={!reason.trim() || cancel.isPending}
                      onClick={async () => {
                        await cancel.mutateAsync(reason)
                        setOpen(false)
                      }}
                    >
                      Confirm
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm">{j.description}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">At a glance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Status" value={<StatusBadge status={j.status} />} />
            <Row label="Headcount" value={`${j.headcountFilled}/${j.headcountRequired}`} />
            <Row label="Payment" value={j.paymentType} />
            <Row
              label="Rate"
              value={
                j.rateSetBy === 'open'
                  ? 'Open to bids'
                  : j.rateAmount
                    ? `${formatCurrency(j.rateAmount)}${j.paymentType === 'hourly' ? '/hr' : ''}`
                    : '–'
              }
            />
            <Row label="Visibility" value={j.visibility} />
            <Row label="Closes" value={formatDate(j.applicationDeadline)} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground capitalize">{label}</span>
      <span className="capitalize">{value}</span>
    </div>
  )
}
