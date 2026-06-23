'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, PenLine, ChevronRight, Flag } from 'lucide-react'
import type { ReportReviewInput } from '@castflow/validators'
import { PageHeader, LoadingState, ErrorState, EmptyState, StatCard } from '@/components/dashboard'
import { Stars } from '@/components/dashboard/stars'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useMyArtistProfile } from '@/lib/hooks/use-artist'
import { useArtistReviews, useReportReview } from '@/lib/hooks/use-reviews'
import { useMyBookings } from '@/lib/hooks/use-bookings'
import { cn, formatDate, formatRating } from '@/lib/utils'

const REPORT_REASONS: { value: ReportReviewInput['reason']; label: string }[] = [
  { value: 'inaccurate', label: 'Inaccurate or untrue' },
  { value: 'harassment', label: 'Harassment or abuse' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' },
]

const REVIEW_OPEN_DAYS = 14
const REVIEW_CLOSE_DAYS = 28
const DAY = 24 * 60 * 60 * 1000

export default function ArtistReviewsPage() {
  const profile = useMyArtistProfile()
  const reviews = useArtistReviews(profile.data?.id)
  const bookings = useMyBookings()

  if (profile.isPending) return <LoadingState rows={3} />
  if (profile.isError || !profile.data) {
    return <ErrorState onRetry={() => void profile.refetch()} />
  }

  const me = profile.data
  const now = Date.now()
  const awaitingReview = (bookings.data ?? []).filter((b) => {
    if (b.status !== 'completed') return false
    const shoot = new Date(b.shootDate).getTime()
    return now >= shoot + REVIEW_OPEN_DAYS * DAY && now <= shoot + REVIEW_CLOSE_DAYS * DAY
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Reviews" description="Feedback from casters you’ve worked with." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Average rating"
          value={me.ratingCount > 0 ? formatRating(me.ratingAvg) : '—'}
          icon={Star}
          hint={
            me.ratingCount > 0
              ? `${me.ratingCount} review${me.ratingCount === 1 ? '' : 's'}`
              : 'New to Platform'
          }
        />
        <StatCard label="Jobs completed" value={me.jobsCompleted} />
        <StatCard
          label="Awaiting your review"
          value={awaitingReview.length}
          accent={awaitingReview.length > 0}
        />
      </div>

      {awaitingReview.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Leave a review</h2>
          <ul className="space-y-2">
            {awaitingReview.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between rounded-xl border border-primary/40 bg-accent/30 p-4"
              >
                <div>
                  <p className="font-medium text-foreground">{b.job?.title ?? 'Completed shoot'}</p>
                  <p className="text-sm text-muted-foreground">
                    {b.caster?.companyName} · shot {formatDate(b.shootDate)}
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href={`/artist/bookings/${b.id}/review`}>
                    <PenLine className="mr-1.5 h-4 w-4" /> Review
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Reviews received</h2>
        {reviews.isPending ? (
          <LoadingState rows={3} />
        ) : reviews.isError ? (
          <ErrorState onRetry={() => void reviews.refetch()} />
        ) : reviews.data && reviews.data.length > 0 ? (
          <ul className="space-y-3">
            {reviews.data.map((r) => {
              const caster = r.booking?.caster?.companyName
              const jobTitle = r.booking?.job?.title
              const bookingId = r.booking?.id
              const card = (
                <Card
                  className={cn(
                    'space-y-2 p-5',
                    bookingId && 'transition-colors hover:border-primary/40'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <Stars value={r.rating} />
                    <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                  </div>
                  {r.comment ? (
                    <p className="text-sm text-foreground">{r.comment}</p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">No comment left.</p>
                  )}
                  <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{caster ?? 'A caster'}</span>
                    {jobTitle ? <span>· {jobTitle}</span> : null}
                    {bookingId ? <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0" /> : null}
                  </div>
                </Card>
              )
              return (
                <li key={r.id} className="space-y-1.5">
                  {bookingId ? <Link href={`/artist/bookings/${bookingId}`}>{card}</Link> : card}
                  <div className="flex items-center justify-between px-1">
                    {r.isFlagged ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600">
                        <Flag className="h-3 w-3" /> Reported — under review
                      </span>
                    ) : (
                      <span />
                    )}
                    {!r.isFlagged ? <ReportReviewDialog reviewId={r.id} profileId={me.id} /> : null}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <EmptyState
            title="No reviews yet"
            description="Once you complete a booking, the caster can leave you a review."
            icon={<Star className="h-6 w-6" />}
          />
        )}
      </section>
    </div>
  )
}

function ReportReviewDialog({ reviewId, profileId }: { reviewId: string; profileId: string }) {
  const report = useReportReview(profileId)
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReviewInput['reason']>('inaccurate')
  const [detail, setDetail] = useState('')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
          <Flag className="mr-1 h-3 w-3" /> Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this review</DialogTitle>
          <DialogDescription>
            Flag a review you believe breaches our terms. Our team reviews reports within 24 hours.
            The review stays visible while we look into it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Select
              value={reason}
              onValueChange={(v) => setReason(v as ReportReviewInput['reason'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-detail">Details (optional)</Label>
            <Textarea
              id="report-detail"
              rows={3}
              maxLength={500}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Anything that helps us review this faster."
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() =>
              report.mutate(
                {
                  reviewId,
                  input: { reason, ...(detail.trim() ? { detail: detail.trim() } : {}) },
                },
                { onSuccess: () => setOpen(false) }
              )
            }
            disabled={report.isPending}
          >
            {report.isPending ? 'Submitting…' : 'Submit report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
