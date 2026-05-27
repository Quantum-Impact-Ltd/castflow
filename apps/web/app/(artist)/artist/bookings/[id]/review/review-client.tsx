'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, Star, CheckCircle2 } from 'lucide-react'
import { submitReviewSchema, type SubmitReviewInput } from '@castflow/validators'
import { ApiError } from '@/lib/fetcher'
import { PageHeader, LoadingState, ErrorState } from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useBooking } from '@/lib/hooks/use-bookings'
import { useBookingReviews, useSubmitReview } from '@/lib/hooks/use-reviews'
import { useMyArtistProfile } from '@/lib/hooks/use-artist'
import { formatDate, cn } from '@/lib/utils'

const DAY_MS = 24 * 60 * 60 * 1000

export function ReviewClient({ bookingId }: { bookingId: string }) {
  const booking = useBooking(bookingId)
  const reviews = useBookingReviews(bookingId)
  const profile = useMyArtistProfile()
  const submit = useSubmitReview(bookingId)

  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<SubmitReviewInput>({
    resolver: zodResolver(submitReviewSchema),
    defaultValues: { rating: 0, comment: '' },
  })

  if (booking.isPending) return <LoadingState variant="detail" />

  if (booking.isError) {
    const status = booking.error instanceof ApiError ? booking.error.status : 0
    if (status === 404 || status === 410) {
      return (
        <div className="space-y-4">
          <BackLink bookingId={bookingId} />
          <ErrorState title="Booking not found" message="This booking may have been removed." />
        </div>
      )
    }
    return (
      <div className="space-y-4">
        <BackLink bookingId={bookingId} />
        <ErrorState onRetry={() => void booking.refetch()} />
      </div>
    )
  }

  const shootTime = new Date(booking.data.shootDate).getTime()
  const opensAt = shootTime + 14 * DAY_MS
  const closesAt = shootTime + 28 * DAY_MS
  const now = Date.now()

  const myProfileId = profile.data?.id
  const existingMine = (reviews.data ?? []).find(
    (r) => r.reviewerRole === 'artist' && (!myProfileId || r.reviewerId === myProfileId),
  )
  const hasSubmitted = submitted || Boolean(existingMine)

  const notCompleted = booking.data.status !== 'completed'
  const beforeWindow = now < opensAt
  const afterWindow = now > closesAt

  function onSubmit(values: SubmitReviewInput) {
    const comment = values.comment?.trim()
    submit.mutate(
      { rating: values.rating, ...(comment ? { comment } : {}) },
      { onSuccess: () => setSubmitted(true) },
    )
  }

  return (
    <div className="space-y-6">
      <BackLink bookingId={bookingId} />

      <PageHeader
        title="Review the caster"
        description={booking.data.caster?.companyName ?? 'CastFlow caster'}
      />

      {hasSubmitted ? (
        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Thanks, your review was submitted</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Reviews can’t be edited once submitted.
            </p>
          </div>
          {existingMine ? (
            <div className="w-full max-w-sm space-y-2 rounded-lg border border-border bg-muted/30 p-4 text-left">
              <Stars value={existingMine.rating} readOnly />
              {existingMine.comment ? (
                <p className="text-sm text-muted-foreground">{existingMine.comment}</p>
              ) : null}
            </div>
          ) : null}
        </Card>
      ) : notCompleted ? (
        <Card className="p-6 text-sm text-muted-foreground">
          You can leave a review once this booking is marked completed.
        </Card>
      ) : beforeWindow ? (
        <Card className="p-6 text-sm text-muted-foreground">
          Reviews open on {formatDate(new Date(opensAt))}.
        </Card>
      ) : afterWindow ? (
        <Card className="p-6 text-sm text-muted-foreground">The review window has closed.</Card>
      ) : (
        <Card className="space-y-6 p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label>Your rating</Label>
              <Stars
                value={rating}
                hovered={hovered}
                onHover={setHovered}
                onChange={(v) => {
                  setRating(v)
                  form.setValue('rating', v, { shouldValidate: true })
                }}
              />
              {form.formState.errors.rating ? (
                <p className="text-sm text-destructive">Please select a rating from 1 to 5.</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Comment (optional)</Label>
              <Textarea
                id="comment"
                rows={5}
                maxLength={500}
                placeholder="Share how the shoot went — communication, professionalism, payment…"
                {...form.register('comment')}
              />
              {form.formState.errors.comment ? (
                <p className="text-sm text-destructive">{form.formState.errors.comment.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Up to 500 characters.</p>
              )}
            </div>

            <Button type="submit" disabled={submit.isPending || rating === 0}>
              {submit.isPending ? 'Submitting…' : 'Submit review'}
            </Button>
          </form>
        </Card>
      )}

      {!hasSubmitted && (reviews.data ?? []).length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Reviews for this booking</h2>
          <ul className="space-y-3">
            {(reviews.data ?? []).map((r) => (
              <li key={r.id} className="space-y-2 rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <Stars value={r.rating} readOnly />
                  <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                </div>
                {r.comment ? <p className="text-sm text-muted-foreground">{r.comment}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function Stars({
  value,
  hovered = 0,
  onChange,
  onHover,
  readOnly,
}: {
  value: number
  hovered?: number
  onChange?: (v: number) => void
  onHover?: (v: number) => void
  readOnly?: boolean
}) {
  const display = hovered || value
  return (
    <div className="flex items-center gap-1" role={readOnly ? undefined : 'radiogroup'}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= display
        if (readOnly) {
          return (
            <Star
              key={n}
              className={cn('h-5 w-5', filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground')}
            />
          )
        }
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            aria-checked={value === n}
            role="radio"
            onClick={() => onChange?.(n)}
            onMouseEnter={() => onHover?.(n)}
            onMouseLeave={() => onHover?.(0)}
            className="rounded-sm p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Star
              className={cn(
                'h-7 w-7 transition-colors',
                filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

function BackLink({ bookingId }: { bookingId: string }) {
  return (
    <Link
      href={`/artist/bookings/${bookingId}`}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" /> Back to booking
    </Link>
  )
}
