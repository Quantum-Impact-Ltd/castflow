'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ErrorState, LoadingState, PageHeader, StatusBadge } from '@/components/dashboard'
import { useMyBids, useWithdrawBid } from '@/lib/hooks/use-bids'
import { formatCurrency, formatDate } from '@/lib/utils'

export function BidDetailClient({ id }: { id: string }) {
  const bids = useMyBids({ limit: 200 })
  const withdraw = useWithdrawBid(id)

  if (bids.isPending) return <LoadingState rows={5} />
  if (bids.isError) return <ErrorState onRetry={() => bids.refetch()} />
  const bid = bids.data?.find((b) => b.id === id)
  if (!bid) return <ErrorState title="Bid not found" />

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Bid detail"
        description={`Submitted ${formatDate(bid.submittedAt)}`}
        actions={
          bid.status === 'pending' ? (
            <Button
              variant="outline"
              onClick={() => withdraw.mutate()}
              disabled={withdraw.isPending}
            >
              Withdraw
            </Button>
          ) : null
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusBadge status={bid.status} />
          {bid.rejectionReason ? (
            <p className="text-muted-foreground mt-2 text-sm">Reason: {bid.rejectionReason}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your proposal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rate</span>
            <span>{formatCurrency(bid.proposedRate)}</span>
          </div>
          {bid.estimatedHours ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated hours</span>
              <span>{bid.estimatedHours}h</span>
            </div>
          ) : null}
          <div>
            <div className="text-muted-foreground mb-1 text-xs">Cover note</div>
            <p className="whitespace-pre-wrap">{bid.coverNote}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
