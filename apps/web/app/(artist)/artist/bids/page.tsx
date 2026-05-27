'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, Pencil, Lock, ArrowUpRight } from 'lucide-react'
import type { BidStatus } from '@castflow/types'
import {
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
  Money,
} from '@/components/dashboard'
import type { BidWithJob } from '@/lib/api/bids'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useMyBids, useWithdrawBid } from '@/lib/hooks/use-bids'
import { formatDate } from '@/lib/utils'

const TABS: { value: string; label: string; status?: BidStatus }[] = [
  { value: 'pending', label: 'Pending', status: 'pending' },
  { value: 'shortlisted', label: 'Shortlisted', status: 'shortlisted' },
  { value: 'rejected', label: 'Rejected', status: 'rejected' },
  { value: 'accepted', label: 'Accepted', status: 'accepted' },
  { value: 'all', label: 'All' },
]

export default function ArtistBidsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My bids"
        description="Track every bid you’ve submitted and its current status."
        actions={
          <Button asChild>
            <Link href="/artist/jobs">Browse jobs</Link>
          </Button>
        }
      />

      <Tabs defaultValue="pending">
        <TabsList className="flex-wrap">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-4">
            <BidsTabPanel status={t.status} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function BidsTabPanel({ status }: { status?: BidStatus }) {
  const { data, isPending, isError, refetch } = useMyBids(status ? { status } : {})

  if (isPending) return <LoadingState rows={3} />
  if (isError) {
    return <ErrorState message="We couldn’t load your bids." onRetry={() => void refetch()} />
  }
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No bids here yet"
        description="Find a shoot that fits and submit a bid to see it appear here."
        icon={<FileText className="h-6 w-6" />}
        action={
          <Button asChild size="sm" variant="outline">
            <Link href="/artist/jobs">Browse the job feed</Link>
          </Button>
        }
      />
    )
  }

  return (
    <ul className="space-y-3">
      {data.map((bid) => (
        <li key={bid.id}>
          <BidRow bid={bid} />
        </li>
      ))}
    </ul>
  )
}

function BidRow({ bid }: { bid: BidWithJob }) {
  const isPending = bid.status === 'pending'
  const isHourly = bid.job?.paymentType === 'hourly'

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/artist/bids/${bid.id}`}
            className="truncate font-medium text-foreground hover:underline"
          >
            {bid.job?.title ?? 'Job'}
          </Link>
          <StatusBadge status={bid.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          <Money amount={bid.proposedRate} />
          {isHourly ? '/hr' : ''}
          {isHourly && bid.estimatedHours ? ` · ${bid.estimatedHours} hrs est.` : ''} · submitted{' '}
          {formatDate(bid.submittedAt)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/artist/jobs/${bid.jobId}`}>
            View job <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
        {isPending ? (
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/artist/bids/${bid.id}`}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
              </Link>
            </Button>
            <WithdrawDialog bidId={bid.id} jobTitle={bid.job?.title ?? 'this job'} />
          </>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-xs text-muted-foreground"
            title="This bid can no longer be edited or withdrawn."
          >
            <Lock className="h-3.5 w-3.5" /> Locked
          </span>
        )}
      </div>
    </div>
  )
}

function WithdrawDialog({ bidId, jobTitle }: { bidId: string; jobTitle: string }) {
  const [open, setOpen] = useState(false)
  const withdraw = useWithdrawBid(bidId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw this bid?</DialogTitle>
          <DialogDescription>
            Your bid for “{jobTitle}” will be withdrawn. This can’t be undone — you’d need to submit
            a new bid to apply again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Keep bid</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={withdraw.isPending}
            onClick={() =>
              withdraw.mutate(undefined, {
                onSuccess: () => setOpen(false),
              })
            }
          >
            {withdraw.isPending ? 'Withdrawing…' : 'Withdraw bid'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
