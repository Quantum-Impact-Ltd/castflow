'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ErrorState, LoadingState, PageHeader, StatusBadge } from '@/components/dashboard'
import { useDispute, useSubmitDisputeEvidence } from '@/lib/hooks/use-disputes'
import { formatDate } from '@/lib/utils'

export function DisputeDetail({ bookingId }: { bookingId: string }) {
  const dispute = useDispute(bookingId)
  const submit = useSubmitDisputeEvidence(bookingId)
  const [content, setContent] = useState('')

  if (dispute.isPending) return <LoadingState rows={5} />
  if (dispute.isError || !dispute.data)
    return <ErrorState title="No dispute" message="There is no dispute on this booking." />

  const d = dispute.data
  return (
    <div className="mx-auto max-w-3xl space-y-6">
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
            <CardTitle className="text-base">Your submission</CardTitle>
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

      {d.resolution ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resolution</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p className="capitalize">{d.resolution.replace(/_/g, ' ')}</p>
            {d.splitArtistPct != null ? <p>Artist share: {d.splitArtistPct}%</p> : null}
            {d.adminNotes ? <p className="text-muted-foreground">{d.adminNotes}</p> : null}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add evidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share screenshots, links, or context that supports your side."
            />
            <Button
              disabled={!content.trim() || submit.isPending}
              onClick={async () => {
                await submit.mutateAsync(content)
                setContent('')
              }}
            >
              {submit.isPending ? 'Submitting…' : 'Submit evidence'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
