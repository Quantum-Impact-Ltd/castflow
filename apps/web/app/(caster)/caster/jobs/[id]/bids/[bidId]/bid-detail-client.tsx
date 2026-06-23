'use client'

import { type ReactNode } from 'react'
import Link from 'next/link'
import { ChevronLeft, MessageSquare, ArrowUpRight } from 'lucide-react'
import {
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
  Money,
} from '@/components/dashboard'
import { RemoteImage } from '@/components/dashboard/remote-image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useBidsForJob } from '@/lib/hooks/use-bids'
import { useJob } from '@/lib/hooks/use-jobs'
import { formatDate } from '@/lib/utils'
import { BidActions, Rating } from '../bids-list-client'

export function CasterBidDetailClient({ jobId, bidId }: { jobId: string; bidId: string }) {
  const bids = useBidsForJob(jobId)
  const job = useJob(jobId)

  if (bids.isPending) return <LoadingState variant="detail" />
  if (bids.isError) {
    return (
      <div className="space-y-4">
        <BackLink jobId={jobId} />
        <ErrorState
          message="We couldn’t load this bid."
          onRetry={() => void bids.refetch()}
        />
      </div>
    )
  }

  const bid = (bids.data ?? []).find((b) => b.id === bidId)
  if (!bid) {
    return (
      <div className="space-y-4">
        <BackLink jobId={jobId} />
        <EmptyState
          title="Bid not found"
          description="This bid may have been withdrawn or no longer exists."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href={`/caster/jobs/${jobId}/bids`}>Back to all bids</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const isHourly = job.data?.paymentType === 'hourly'
  const artist = bid.artist
  const portfolio = artist?.portfolioItems ?? []
  const primary = portfolio.find((p) => p.isPrimary) ?? portfolio[0]
  const highlights = bid.highlightedPortfolioItems
    .map((id) => portfolio.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))

  return (
    <div className="space-y-6">
      <BackLink jobId={jobId} />

      <PageHeader
        title={`${artist?.firstName ?? 'Artist'}’s bid`}
        description={job.data?.title ?? 'Bid on your job'}
        actions={<StatusBadge status={bid.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-4 p-6">
            <h2 className="text-sm font-semibold text-foreground">The offer</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail
                label={isHourly ? 'Proposed hourly rate' : 'Proposed fee'}
                value={
                  <>
                    <Money amount={bid.proposedRate} />
                    {isHourly ? '/hr' : ''}
                  </>
                }
              />
              {isHourly && bid.estimatedHours !== null ? (
                <Detail label="Estimated hours" value={`${bid.estimatedHours} hrs`} />
              ) : null}
              {isHourly && bid.estimatedHours !== null ? (
                <Detail
                  label="Estimated total"
                  value={<Money amount={Number(bid.proposedRate) * Number(bid.estimatedHours)} />}
                />
              ) : null}
              <Detail label="Submitted" value={formatDate(bid.submittedAt)} />
            </dl>
          </Card>

          <Card className="space-y-3 p-6">
            <h2 className="text-sm font-semibold text-foreground">Cover note</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {bid.coverNote || 'No cover note provided.'}
            </p>
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="text-sm font-semibold text-foreground">Highlighted portfolio</h2>
            {highlights.length > 0 ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {highlights.map((item) => (
                  <div
                    key={item.id}
                    className="relative aspect-[3/4] overflow-hidden rounded-lg border border-border"
                  >
                    <RemoteImage
                      src={item.url}
                      alt={item.caption ?? 'Portfolio item'}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No highlighted portfolio items are available for this bid.
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-4 p-6">
            <h2 className="text-sm font-semibold text-foreground">Decision</h2>
            <StatusBadge status={bid.status} />
            <Separator />
            <div className="flex flex-wrap items-center gap-2">
              <BidActions jobId={jobId} bid={bid} />
            </div>
          </Card>

          {artist ? (
            <Card className="space-y-3 p-6">
              <h2 className="text-sm font-semibold text-foreground">Artist</h2>
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                  {primary ? (
                    <RemoteImage
                      src={primary.url}
                      alt={artist.firstName}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">
                      {artist.firstName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{artist.firstName}</p>
                  <p className="text-xs capitalize text-muted-foreground">{artist.artistType}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                <Rating ratingAvg={artist.ratingAvg} ratingCount={artist.ratingCount} />
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/caster/talent/${artist.id}`}>
                  View full profile <ArrowUpRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              {bid.status === 'shortlisted' ? (
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/caster/messages">
                    <MessageSquare className="mr-1.5 h-4 w-4" /> Message
                  </Link>
                </Button>
              ) : null}
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function BackLink({ jobId }: { jobId: string }) {
  return (
    <Link
      href={`/caster/jobs/${jobId}/bids`}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" /> Back to all bids
    </Link>
  )
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  )
}
