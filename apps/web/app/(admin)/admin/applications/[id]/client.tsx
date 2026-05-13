'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ErrorState, LoadingState, PageHeader, StatusBadge } from '@/components/dashboard'
import { useApplications, useApproveApplication, useRejectApplication } from '@/lib/hooks/use-admin'
import { formatDate } from '@/lib/utils'

const REJECT_REASONS = [
  'portfolio_quality',
  'id_unclear',
  'profile_incomplete',
  'suspected_duplicate',
  'other',
]

export function ApplicationReviewClient({ id }: { id: string }) {
  const list = useApplications({ limit: 500 })
  const approve = useApproveApplication()
  const reject = useRejectApplication()
  const [notes, setNotes] = useState('')
  const [reason, setReason] = useState('portfolio_quality')

  if (list.isPending) return <LoadingState rows={6} />
  if (list.isError) return <ErrorState onRetry={() => list.refetch()} />
  const app = list.data?.find((a) => a.id === id)
  if (!app) return <ErrorState title="Application not found" />

  const portfolio =
    (app as unknown as { portfolioItems?: Array<{ id: string; url: string }> }).portfolioItems ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${app.firstName} ${app.lastName ?? ''}`}
        description={`${app.artistType} · ${app.city ?? '—'} · Submitted ${formatDate(app.createdAt)}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/applications">Back</Link>
            </Button>
            <StatusBadge status={app.approvalStatus} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <Row label="DOB" value={app.dob ? formatDate(app.dob) : '—'} />
            <Row label="Gender" value={app.gender ?? '—'} />
            <Row label="City" value={app.city ?? '—'} />
            <Row label="Experience" value={app.experienceLevel ?? '—'} />
            {app.bio ? (
              <div>
                <div className="text-muted-foreground text-xs">Bio</div>
                <p className="whitespace-pre-wrap">{app.bio}</p>
              </div>
            ) : null}
            {portfolio.length ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {portfolio.map((p) => (
                  <img
                    key={p.id}
                    src={p.url}
                    alt=""
                    className="aspect-square w-full rounded-md object-cover"
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">No portfolio uploaded yet.</p>
            )}
          </CardContent>
        </Card>

        {app.approvalStatus === 'pending' ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Reason (if rejecting)</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REJECT_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Notes (internal)</Label>
                <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => approve.mutate({ id, notes: notes || undefined })}
                  disabled={approve.isPending}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => reject.mutate({ id, reason, notes: notes || undefined })}
                  disabled={reject.isPending}
                >
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 text-sm">
              <p>
                Status: <span className="capitalize">{app.approvalStatus}</span>
              </p>
              {app.approvalNotes ? (
                <p className="text-muted-foreground mt-2">{app.approvalNotes}</p>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="capitalize">{value}</span>
    </div>
  )
}
