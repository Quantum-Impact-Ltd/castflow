'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from '@/components/dashboard'
import {
  useBidsForJob,
  useAcceptBid,
  useRejectBid,
  useShortlistBid,
  useUndoRejectBid,
} from '@/lib/hooks/use-bids'
import { formatCurrency, formatDate } from '@/lib/utils'

export function CasterBidsClient({ jobId }: { jobId: string }) {
  const bids = useBidsForJob(jobId)
  const shortlist = useShortlistBid(jobId)
  const reject = useRejectBid(jobId)
  const undoReject = useUndoRejectBid(jobId)
  const accept = useAcceptBid(jobId)

  if (bids.isPending) return <LoadingState rows={5} />
  if (bids.isError) return <ErrorState onRetry={() => bids.refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bids"
        description={`${bids.data?.length ?? 0} bids on this job.`}
        actions={
          <Button asChild variant="outline">
            <Link href={`/caster/jobs/${jobId}`}>Back to job</Link>
          </Button>
        }
      />

      {!bids.data?.length ? (
        <EmptyState
          title="No bids yet"
          description="Artists matching your job will see it in their feed."
        />
      ) : (
        <ul className="space-y-3">
          {bids.data.map((bid) => (
            <li key={bid.id}>
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {bid.artist
                        ? `${bid.artist.firstName} ${bid.artist.lastName ?? ''}`.trim()
                        : 'Artist'}
                    </CardTitle>
                    <p className="text-muted-foreground text-xs">
                      Submitted {formatDate(bid.submittedAt)}
                    </p>
                  </div>
                  <StatusBadge status={bid.status} />
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate</span>
                    <span>
                      {formatCurrency(bid.proposedRate)}
                      {bid.estimatedHours ? ` × ${bid.estimatedHours}h` : ''}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{bid.coverNote}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/caster/jobs/${jobId}/bids/${bid.id}`}>View profile</Link>
                    </Button>
                    {bid.status === 'pending' || bid.status === 'shortlisted' ? (
                      <>
                        {bid.status === 'pending' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={shortlist.isPending}
                            onClick={() => shortlist.mutate(bid.id)}
                          >
                            Shortlist
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          disabled={accept.isPending}
                          onClick={() => accept.mutate(bid.id)}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={reject.isPending}
                          onClick={() => reject.mutate({ bidId: bid.id })}
                        >
                          Reject
                        </Button>
                      </>
                    ) : null}
                    {bid.status === 'rejected' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={undoReject.isPending}
                        onClick={() => undoReject.mutate(bid.id)}
                      >
                        Undo reject
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
