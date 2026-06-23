import type { Review } from '@castflow/types'
import type { SubmitReviewInput, ReportReviewInput } from '@castflow/validators'
import { fetcher } from '@/lib/fetcher'
import type { Init } from './types'

/** A review plus the booking context (job + counterparty) the list endpoints attach. */
export interface ReviewWithContext extends Review {
  booking?: {
    id: string
    job: { id: string; title: string } | null
    caster?: { id: string; companyName: string } | null
    artist?: { id: string; firstName: string } | null
  }
}

export function submitReview(bookingId: string, input: SubmitReviewInput) {
  return fetcher<Review>(`/reviews/bookings/${bookingId}`, {
    method: 'POST',
    body: input,
  })
}

export function getBookingReviews(bookingId: string, init?: Init) {
  return fetcher<Review[]>(`/reviews/bookings/${bookingId}`, init)
}

export function getArtistReviews(profileId: string, init?: Init) {
  return fetcher<ReviewWithContext[]>(`/reviews/artists/${profileId}`, init)
}

export function reportReview(reviewId: string, input: ReportReviewInput) {
  return fetcher<{ ok: true }>(`/reviews/${reviewId}/report`, { method: 'POST', body: input })
}
