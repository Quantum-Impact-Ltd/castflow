'use client'

import Link from 'next/link'
import { Star, PenLine } from 'lucide-react'
import { PageHeader, LoadingState, ErrorState, EmptyState, StatCard } from '@/components/dashboard'
import { Stars } from '@/components/dashboard/stars'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMyArtistProfile } from '@/lib/hooks/use-artist'
import { useArtistReviews } from '@/lib/hooks/use-reviews'
import { useMyBookings } from '@/lib/hooks/use-bookings'
import { formatDate } from '@/lib/utils'

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
          value={me.ratingCount > 0 ? (me.ratingAvg ?? 0).toFixed(1) : '—'}
          icon={Star}
          hint={me.ratingCount > 0 ? `${me.ratingCount} review${me.ratingCount === 1 ? '' : 's'}` : 'New to Platform'}
        />
        <StatCard label="Jobs completed" value={me.jobsCompleted} />
        <StatCard label="Awaiting your review" value={awaitingReview.length} accent={awaitingReview.length > 0} />
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
            {reviews.data.map((r) => (
              <li key={r.id}>
                <Card className="space-y-2 p-5">
                  <div className="flex items-center justify-between">
                    <Stars value={r.rating} />
                    <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                  </div>
                  {r.comment ? (
                    <p className="text-sm text-foreground">{r.comment}</p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">No comment left.</p>
                  )}
                  <Badge variant="secondary" className="w-fit">From a caster</Badge>
                </Card>
              </li>
            ))}
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
