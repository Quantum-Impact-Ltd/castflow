'use client'

import { useState } from 'react'
import Link from 'next/link'
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
import { useAdminJob, useRemoveJob } from '@/lib/hooks/use-admin'
import { formatCurrency, formatDate } from '@/lib/utils'

export function AdminJobDetailClient({ id }: { id: string }) {
  const job = useAdminJob(id)
  const remove = useRemoveJob()
  const [reason, setReason] = useState('')
  const [open, setOpen] = useState(false)

  if (job.isPending) return <LoadingState rows={5} />
  if (job.isError || !job.data) return <ErrorState onRetry={() => job.refetch()} />
  const j = job.data

  return (
    <div className="space-y-6">
      <PageHeader
        title={j.title}
        description={`${j.category} · ${j.locationCity}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/jobs">Back</Link>
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">Remove job</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Remove this job from the platform?</DialogTitle>
                </DialogHeader>
                <Textarea
                  rows={4}
                  placeholder="Reason (required, ≥5 chars)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={reason.trim().length < 5 || remove.isPending}
                    onClick={async () => {
                      await remove.mutateAsync({ id, reason })
                      setOpen(false)
                    }}
                  >
                    Remove
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overview</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <Row label="Status" value={<StatusBadge status={j.status} />} />
          <Row label="Visibility" value={j.visibility} />
          <Row label="Headcount" value={`${j.headcountFilled}/${j.headcountRequired}`} />
          <Row label="Shoot" value={formatDate(j.shootDate)} />
          <Row
            label="Rate"
            value={
              j.rateSetBy === 'open'
                ? 'Open to bids'
                : j.rateAmount
                  ? formatCurrency(j.rateAmount)
                  : '—'
            }
          />
          <Row label="Caster" value={j.caster?.companyName ?? j.casterId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Description</CardTitle>
        </CardHeader>
        <CardContent className="text-sm whitespace-pre-wrap">{j.description}</CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="capitalize">{value}</span>
    </div>
  )
}
