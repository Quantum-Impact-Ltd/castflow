'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { SubmitReviewInput } from '@castflow/validators'
import { queryKeys } from '@/lib/query-keys'
import { getArtistReviews, getBookingReviews, submitReview } from '@/lib/api/reviews'
import { errorMessage } from './util'

export function useBookingReviews(bookingId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.reviews.forBooking(bookingId ?? ''),
    queryFn: ({ signal }) => getBookingReviews(bookingId!, { signal }),
    enabled: Boolean(bookingId),
  })
}

export function useArtistReviews(profileId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.reviews.forArtist(profileId ?? ''),
    queryFn: ({ signal }) => getArtistReviews(profileId!, { signal }),
    enabled: Boolean(profileId),
  })
}

export function useSubmitReview(bookingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SubmitReviewInput) => submitReview(bookingId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.reviews.forBooking(bookingId) })
      toast.success('Review submitted')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}
