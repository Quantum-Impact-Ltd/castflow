import type { Review } from '@castflow/types'
import type { SubmitReviewInput } from '@castflow/validators'
import { fetcher } from '@/lib/fetcher'
import type { Init } from './types'

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
  return fetcher<Review[]>(`/reviews/artists/${profileId}`, init)
}
