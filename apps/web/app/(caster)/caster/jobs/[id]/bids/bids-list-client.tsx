'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  Users,
  Star,
  MessageSquare,
  ArrowUpRight,
  ArrowUpDown,
  Undo2,
} from 'lucide-react'
import {
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
  Money,
} from '@/components/dashboard'
import { RemoteImage } from '@/components/dashboard/remote-image'
import type { BidForCaster } from '@/lib/api/bids'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { useJob } from '@/lib/hooks/use-jobs'
import {
  useBidsForJob,
  useShortlistBid,
  useRejectBid,
  useUndoRejectBid,
  useAcceptBid,
} from '@/lib/hooks/use-bids'
import { formatDate, formatRating } from '@/lib/utils'

type SortKey = 'submitted' | 'rate' | 'status'

// Lower rank sorts first when grouping by shortlist status.
const STATUS_RANK: Record<string, number> = {
  shortlisted: 0,
  pending: 1,
  accepted: 2,
  rejected: 3,
  withdrawn: 4,
  expired: 5,
}

export function BidsListClient({ jobId }: { jobId: string }) {
  const { data: bids, isPending, isError, refetch } = useBidsForJob(jobId)
  const job = useJob(jobId)
  const [sort, setSort] = useState<SortKey>('status')

  if (isPending) return <LoadingState rows={3} />
  if (isError) {
    return (
      <div className="space-y-4">
        <BackLink jobId={jobId} />
        <ErrorState
          message="We couldn’t load the bids for this job."
          onRetry={() => void refetch()}
        />
      </div>
    )
  }

  const isHourly = job.data?.paymentType === 'hourly'
  const spotsRemaining = job.data
    ? Math.max(job.data.headcountRequired - job.data.headcountFilled, 0)
    : null

  const sorted = [...(bids ?? [])].sort((a, b) => {
    if (sort === 'submitted') {
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    }
    if (sort === 'rate') return b.proposedRate - a.proposedRate
    return (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9)
  })

  return (
    <div className="space-y-6">
      <BackLink jobId={jobId} />

      <PageHeader
        title={job.data?.title ? `Bids · ${job.data.title}` : 'Bids'}
        description={`${bids?.length ?? 0} ${bids?.length === 1 ? 'bid' : 'bids'} received.`}
        actions={
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-[190px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">Shortlist status</SelectItem>
                <SelectItem value="submitted">Date submitted</SelectItem>
                <SelectItem value="rate">Proposed rate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {spotsRemaining !== null ? (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{spotsRemaining}</span>
          <span className="text-muted-foreground">
            {spotsRemaining === 1 ? 'spot' : 'spots'} remaining to fill on this job.
          </span>
        </div>
      ) : null}

      {!bids || bids.length === 0 ? (
        <EmptyState
          title="No bids yet"
          description="When artists bid on this job, they’ll appear here for you to review."
          icon={<Users className="h-6 w-6" />}
        />
      ) : (
        <ul className="space-y-4">
          {sorted.map((bid) => (
            <li key={bid.id}>
              <BidCard jobId={jobId} bid={bid} isHourly={isHourly} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function BidCard({
  jobId,
  bid,
  isHourly,
}: {
  jobId: string
  bid: BidForCaster
  isHourly: boolean
}) {
  const artist = bid.artist
  const portfolio = artist?.portfolioItems ?? []
  const primary = portfolio.find((p) => p.isPrimary) ?? portfolio[0]
  const highlights = bid.highlightedPortfolioItems
    .map((id) => portfolio.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 4)

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
            {primary ? (
              <RemoteImage
                src={primary.url}
                alt={artist?.firstName ?? 'Artist'}
                fill
                sizes="48px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">
                {(artist?.firstName ?? '?').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-foreground">{artist?.firstName ?? 'Artist'}</p>
              {artist?.artistType ? (
                <span className="text-xs capitalize text-muted-foreground">
                  {artist.artistType}
                </span>
              ) : null}
              <StatusBadge status={bid.status} />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              <Rating
                ratingAvg={artist?.ratingAvg ?? null}
                ratingCount={artist?.ratingCount ?? 0}
              />
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-lg font-semibold text-foreground">
            <Money amount={bid.proposedRate} />
            {isHourly ? '/hr' : ''}
          </p>
          {isHourly && bid.estimatedHours ? (
            <p className="text-xs text-muted-foreground">{bid.estimatedHours} hrs estimated</p>
          ) : null}
          <p className="text-xs text-muted-foreground">Submitted {formatDate(bid.submittedAt)}</p>
        </div>
      </div>

      {bid.coverNote ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {bid.coverNote}
        </p>
      ) : null}

      {highlights.length > 0 ? (
        <div className="grid grid-cols-4 gap-2 sm:max-w-sm">
          {highlights.map((item) => (
            <div
              key={item.id}
              className="relative aspect-[3/4] overflow-hidden rounded-lg border border-border"
            >
              <RemoteImage
                src={item.url}
                alt={item.caption ?? 'Portfolio item'}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        {artist?.id ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/caster/talent/${artist.id}`}>
              View profile <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        ) : null}
        <Button asChild variant="ghost" size="sm">
          <Link href={`/caster/jobs/${jobId}/bids/${bid.id}`}>Open bid</Link>
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <BidActions jobId={jobId} bid={bid} />
        </div>
      </div>
    </Card>
  )
}

/** Status-driven caster actions, shared between the list and detail views. */
export function BidActions({ jobId, bid }: { jobId: string; bid: BidForCaster }) {
  const router = useRouter()
  const shortlist = useShortlistBid(jobId)
  const accept = useAcceptBid(jobId)
  const undo = useUndoRejectBid(jobId)

  const onAccept = () =>
    accept.mutate(bid.id, {
      onSuccess: (data) => router.push(`/caster/bookings/${data.bookingId}/pay`),
    })

  if (bid.status === 'pending') {
    return (
      <>
        <RejectDialog jobId={jobId} bidId={bid.id} />
        <Button
          variant="outline"
          size="sm"
          disabled={shortlist.isPending}
          onClick={() => shortlist.mutate(bid.id)}
        >
          {shortlist.isPending ? 'Shortlisting…' : 'Shortlist'}
        </Button>
        <Button size="sm" disabled={accept.isPending} onClick={onAccept}>
          {accept.isPending ? 'Accepting…' : 'Accept'}
        </Button>
      </>
    )
  }

  if (bid.status === 'shortlisted') {
    return (
      <>
        <RejectDialog jobId={jobId} bidId={bid.id} />
        <Button asChild variant="outline" size="sm">
          <Link href="/caster/messages">
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Message
          </Link>
        </Button>
        <Button size="sm" disabled={accept.isPending} onClick={onAccept}>
          {accept.isPending ? 'Accepting…' : 'Accept'}
        </Button>
      </>
    )
  }

  if (bid.status === 'rejected') {
    // Undo is only meaningful within 24h of the reject (tracked via updatedAt).
    const within24h = Date.now() - new Date(bid.updatedAt).getTime() < 24 * 60 * 60 * 1000
    if (within24h) {
      return (
        <Button
          variant="outline"
          size="sm"
          disabled={undo.isPending}
          onClick={() => undo.mutate(bid.id)}
        >
          <Undo2 className="mr-1.5 h-3.5 w-3.5" />
          {undo.isPending ? 'Undoing…' : 'Undo reject'}
        </Button>
      )
    }
    return <StatusBadge status={bid.status} />
  }

  // accepted / withdrawn / expired — terminal, just show the status.
  return <StatusBadge status={bid.status} />
}

function RejectDialog({ jobId, bidId }: { jobId: string; bidId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const reject = useRejectBid(jobId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          Reject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject this bid?</DialogTitle>
          <DialogDescription>
            The artist will be notified. You can undo a rejection within 24 hours.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="reject-reason">Reason (optional)</Label>
          <Textarea
            id="reject-reason"
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="A short, kind note helps artists improve."
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Keep bid</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={reject.isPending}
            onClick={() =>
              reject.mutate(
                { bidId, ...(reason.trim() ? { reason: reason.trim() } : {}) },
                {
                  onSuccess: () => {
                    setOpen(false)
                    setReason('')
                  },
                }
              )
            }
          >
            {reject.isPending ? 'Rejecting…' : 'Reject bid'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function Rating({
  ratingAvg,
  ratingCount,
}: {
  ratingAvg: number | null
  ratingCount: number
}) {
  if (ratingAvg === null || ratingCount === 0) {
    return <span>New to platform</span>
  }
  return (
    <span className="inline-flex items-center gap-1">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      {formatRating(ratingAvg)}
      <span className="text-muted-foreground">
        ({ratingCount} {ratingCount === 1 ? 'review' : 'reviews'})
      </span>
    </span>
  )
}

function BackLink({ jobId }: { jobId: string }) {
  return (
    <Link
      href={`/caster/jobs/${jobId}`}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" /> Back to job
    </Link>
  )
}
