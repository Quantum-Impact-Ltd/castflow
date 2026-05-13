'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ErrorState, LoadingState, PageHeader, StatusBadge } from '@/components/dashboard'
import type { DisputeResolution } from '@castflow/types'
import { useDispute, useResolveDispute } from '@/lib/hooks/use-disputes'
import { formatDate } from '@/lib/utils'

export function AdminDisputeDetailClient({ bookingId }: { bookingId: string }) {
  const dispute = useDispute(bookingId)
  const resolve = useResolveDispute(bookingId)
  const [resolution, setResolution] = useState<DisputeResolution>('full_release_to_artist')
  const [splitPct, setSplitPct] = useState(50)
  const [notes, setNotes] = useState('')

  if (dispute.isPending) return <LoadingState rows={5} />
  if (dispute.isError || !dispute.data) return <ErrorState onRetry={() => dispute.refetch()} />
  const d = dispute.data
  const isOpen = d.status === 'open' || d.status === 'under_review'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dispute"
        description={`Opened ${formatDate(d.createdAt)}`}
        actions={<StatusBadge status={d.status} />}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reason</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p className="capitalize">{d.reason.replace(/_/g, ' ')}</p>
          <p className="whitespace-pre-wrap">{d.description}</p>
        </CardContent>
      </Card>

      {d.artistSubmission ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Artist's submission</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm">{d.artistSubmission}</CardContent>
        </Card>
      ) : null}
      {d.casterSubmission ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Caster's submission</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm">{d.casterSubmission}</CardContent>
        </Card>
      ) : null}

      {isOpen ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resolve</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Outcome</Label>
              <Select
                value={resolution}
                onValueChange={(v) => setResolution(v as DisputeResolution)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_release_to_artist">Full release to artist</SelectItem>
                  <SelectItem value="full_refund_to_caster">Full refund to caster</SelectItem>
                  <SelectItem value="split">Split between parties</SelectItem>
                  <SelectItem value="escalated">Escalate (no money movement)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {resolution === 'split' ? (
              <div className="space-y-1.5">
                <Label>Artist share (%)</Label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={splitPct}
                  onChange={(e) => setSplitPct(Number(e.target.value))}
                />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label>Admin notes</Label>
              <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <Button
              disabled={!notes.trim() || resolve.isPending}
              onClick={() =>
                resolve.mutate({
                  resolution,
                  adminNotes: notes,
                  ...(resolution === 'split' ? { splitArtistPct: splitPct } : {}),
                })
              }
            >
              {resolve.isPending ? 'Resolving…' : 'Submit resolution'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm">
            <p>
              Resolution: <span className="capitalize">{d.resolution?.replace(/_/g, ' ')}</span>
              {d.splitArtistPct != null ? ` (artist ${d.splitArtistPct}%)` : ''}
            </p>
            {d.adminNotes ? <p className="text-muted-foreground mt-2">{d.adminNotes}</p> : null}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
