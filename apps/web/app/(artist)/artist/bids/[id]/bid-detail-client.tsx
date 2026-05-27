'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, MessageSquare, Lock } from 'lucide-react'
import {
  updateBidSchema,
  counterOfferSchema,
  type UpdateBidInput,
  type CounterOfferInput,
} from '@castflow/validators'
import type { PortfolioItem } from '@castflow/types'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
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
import { useMyBids, useUpdateBid, useWithdrawBid, useCounterOffer } from '@/lib/hooks/use-bids'
import { useMyArtistProfile } from '@/lib/hooks/use-artist'
import { formatDate } from '@/lib/utils'

export function ArtistBidDetailClient({ bidId }: { bidId: string }) {
  const bids = useMyBids({})
  const profile = useMyArtistProfile()

  if (bids.isPending || profile.isPending) return <LoadingState variant="detail" />
  if (bids.isError) {
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorState message="We couldn’t load your bid." onRetry={() => void bids.refetch()} />
      </div>
    )
  }

  const bid = (bids.data ?? []).find((b) => b.id === bidId)
  if (!bid) {
    return (
      <div className="space-y-4">
        <BackLink />
        <EmptyState
          title="Bid not found"
          description="This bid may have been withdrawn or no longer exists."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/artist/bids">Back to my bids</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const portfolio = profile.data?.portfolioItems ?? []
  const highlights = bid.highlightedPortfolioItems
    .map((id) => portfolio.find((p) => p.id === id))
    .filter((p): p is PortfolioItem => Boolean(p))

  const isHourly = bid.job?.paymentType === 'hourly'

  return (
    <div className="space-y-6">
      <BackLink />

      <PageHeader
        title={bid.job?.title ?? 'Your bid'}
        description="Your submitted bid and its current status."
        actions={<StatusBadge status={bid.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-4 p-6">
            <h2 className="text-sm font-semibold text-foreground">Your offer</h2>
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
              <Detail label="Submitted" value={formatDate(bid.submittedAt)} />
              {bid.rejectionReason ? (
                <div className="sm:col-span-2">
                  <Detail label="Reason given" value={bid.rejectionReason} />
                </div>
              ) : null}
            </dl>
          </Card>

          <Card className="space-y-3 p-6">
            <h2 className="text-sm font-semibold text-foreground">Cover note</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {bid.coverNote}
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
                The highlighted items are no longer in your portfolio.
              </p>
            )}
          </Card>

          {bid.status === 'pending' ? (
            <EditBidCard bid={bid} isHourly={isHourly} />
          ) : null}

          {bid.status === 'shortlisted' ? <CounterOfferCard bidId={bid.id} isHourly={isHourly} /> : null}
        </div>

        <div className="space-y-4">
          <Card className="space-y-3 p-6">
            <h2 className="text-sm font-semibold text-foreground">Status</h2>
            <StatusBadge status={bid.status} />
            <Separator />
            {bid.status === 'shortlisted' ? (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>You’ve been shortlisted — messaging with the caster is now unlocked.</p>
                <Button asChild className="w-full">
                  <Link href="/artist/messages">
                    <MessageSquare className="mr-1.5 h-4 w-4" /> Open messages
                  </Link>
                </Button>
              </div>
            ) : bid.status === 'pending' ? (
              <p className="text-sm text-muted-foreground">
                Awaiting the caster’s decision. You can edit or withdraw while it’s pending.
              </p>
            ) : (
              <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Lock className="h-3.5 w-3.5" /> This bid is locked and can no longer be changed.
              </p>
            )}
          </Card>

          {bid.job ? (
            <Card className="space-y-3 p-6">
              <h2 className="text-sm font-semibold text-foreground">Linked job</h2>
              <p className="text-sm text-muted-foreground">{bid.job.title}</p>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/artist/jobs/${bid.jobId}`}>View job</Link>
              </Button>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function EditBidCard({
  bid,
  isHourly,
}: {
  bid: { id: string; proposedRate: number; estimatedHours: number | null; coverNote: string }
  isHourly: boolean
}) {
  const update = useUpdateBid(bid.id)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UpdateBidInput>({
    resolver: zodResolver(updateBidSchema),
    defaultValues: {
      proposedRate: bid.proposedRate,
      ...(isHourly && bid.estimatedHours !== null ? { estimatedHours: bid.estimatedHours } : {}),
      coverNote: bid.coverNote,
    },
  })

  const coverNote = watch('coverNote') ?? ''

  const onSubmit = handleSubmit((data) => update.mutate(data))

  return (
    <Card className="space-y-5 p-6">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Edit your bid</h2>
        <p className="text-xs text-muted-foreground">
          You can update your bid while it’s still pending.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="proposedRate">
            {isHourly ? 'Proposed hourly rate (£)' : 'Proposed fee (£)'}
          </Label>
          <Input
            id="proposedRate"
            type="number"
            step="0.01"
            inputMode="decimal"
            {...register('proposedRate', { valueAsNumber: true })}
          />
          {errors.proposedRate ? (
            <p className="text-xs text-destructive">{errors.proposedRate.message}</p>
          ) : null}
        </div>

        {isHourly ? (
          <div className="space-y-1.5">
            <Label htmlFor="estimatedHours">Estimated hours</Label>
            <Input
              id="estimatedHours"
              type="number"
              step="0.5"
              inputMode="decimal"
              {...register('estimatedHours', { valueAsNumber: true })}
            />
            {errors.estimatedHours ? (
              <p className="text-xs text-destructive">{errors.estimatedHours.message}</p>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="coverNote">Cover note</Label>
            <span className="text-xs text-muted-foreground">{coverNote.length}/500</span>
          </div>
          <Textarea id="coverNote" rows={5} maxLength={500} {...register('coverNote')} />
          {errors.coverNote ? (
            <p className="text-xs text-destructive">{errors.coverNote.message}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-2">
          <WithdrawDialog bidId={bid.id} />
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

function CounterOfferCard({ bidId, isHourly }: { bidId: string; isHourly: boolean }) {
  const counter = useCounterOffer(bidId)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CounterOfferInput>({
    resolver: zodResolver(counterOfferSchema),
  })

  const onSubmit = handleSubmit((data) => counter.mutate(data, { onSuccess: () => reset() }))

  return (
    <Card className="space-y-5 p-6">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Send a counter-offer</h2>
        <p className="text-xs text-muted-foreground">
          Propose revised terms back to the caster. They can accept or decline.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="counterRate">
            {isHourly ? 'New hourly rate (£)' : 'New fee (£)'}
          </Label>
          <Input
            id="counterRate"
            type="number"
            step="0.01"
            inputMode="decimal"
            {...register('proposedRate', { valueAsNumber: true })}
          />
          {errors.proposedRate ? (
            <p className="text-xs text-destructive">{errors.proposedRate.message}</p>
          ) : null}
        </div>

        {isHourly ? (
          <div className="space-y-1.5">
            <Label htmlFor="counterHours">Estimated hours</Label>
            <Input
              id="counterHours"
              type="number"
              step="0.5"
              inputMode="decimal"
              {...register('estimatedHours', { valueAsNumber: true })}
            />
            {errors.estimatedHours ? (
              <p className="text-xs text-destructive">{errors.estimatedHours.message}</p>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="counterMessage">Message (optional)</Label>
          <Textarea
            id="counterMessage"
            rows={4}
            maxLength={500}
            placeholder="Add a short note explaining your counter-offer."
            {...register('message')}
          />
          {errors.message ? (
            <p className="text-xs text-destructive">{errors.message.message}</p>
          ) : null}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={counter.isPending}>
            {counter.isPending ? 'Sending…' : 'Send counter-offer'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

function WithdrawDialog({ bidId }: { bidId: string }) {
  const [open, setOpen] = useState(false)
  const withdraw = useWithdrawBid(bidId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" className="text-destructive hover:text-destructive">
          Withdraw bid
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw this bid?</DialogTitle>
          <DialogDescription>
            This can’t be undone — you’d need to submit a new bid to apply again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Keep bid</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={withdraw.isPending}
            onClick={() => withdraw.mutate(undefined, { onSuccess: () => setOpen(false) })}
          >
            {withdraw.isPending ? 'Withdrawing…' : 'Withdraw bid'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BackLink() {
  return (
    <Link
      href="/artist/bids"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" /> Back to my bids
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
