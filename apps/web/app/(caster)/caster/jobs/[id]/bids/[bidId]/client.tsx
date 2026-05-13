'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ErrorState, LoadingState, PageHeader, StatusBadge } from '@/components/dashboard'
import { useAcceptBid, useBidsForJob, useRejectBid, useShortlistBid } from '@/lib/hooks/use-bids'
import { useTalentProfile } from '@/lib/hooks/use-talent'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Props {
  jobId: string
  bidId: string
}

export function CasterBidDetailClient({ jobId, bidId }: Props) {
  const bids = useBidsForJob(jobId)
  const bid = bids.data?.find((b) => b.id === bidId)
  const artist = useTalentProfile(bid?.artistId)
  const shortlist = useShortlistBid(jobId)
  const reject = useRejectBid(jobId)
  const accept = useAcceptBid(jobId)

  if (bids.isPending) return <LoadingState rows={6} />
  if (bids.isError) return <ErrorState onRetry={() => bids.refetch()} />
  if (!bid) return <ErrorState title="Bid not found" />

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          bid.artist ? `${bid.artist.firstName} ${bid.artist.lastName ?? ''}`.trim() : 'Bid detail'
        }
        description={`Submitted ${formatDate(bid.submittedAt)}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/caster/jobs/${jobId}/bids`}>Back</Link>
            </Button>
            <StatusBadge status={bid.status} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Cover note</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">{bid.coverNote}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proposal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Rate" value={formatCurrency(bid.proposedRate)} />
            {bid.estimatedHours ? <Row label="Hours" value={`${bid.estimatedHours}h`} /> : null}
            <div className="flex flex-wrap gap-2 pt-3">
              {bid.status === 'pending' ? (
                <Button size="sm" variant="outline" onClick={() => shortlist.mutate(bid.id)}>
                  Shortlist
                </Button>
              ) : null}
              {bid.status === 'pending' || bid.status === 'shortlisted' ? (
                <>
                  <Button size="sm" onClick={() => accept.mutate(bid.id)}>
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => reject.mutate({ bidId: bid.id })}
                  >
                    Reject
                  </Button>
                </>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {artist.data ? (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-base">Artist profile</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p>
                <span className="text-muted-foreground">Type:</span>{' '}
                <span className="capitalize">{artist.data.artistType}</span>
              </p>
              {artist.data.bio ? <p className="whitespace-pre-wrap">{artist.data.bio}</p> : null}
              {artist.data.portfolioItems?.length ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {artist.data.portfolioItems.slice(0, 10).map((p) => (
                    <img
                      key={p.id}
                      src={p.url}
                      alt=""
                      className="aspect-square w-full rounded-md object-cover"
                    />
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  )
}
