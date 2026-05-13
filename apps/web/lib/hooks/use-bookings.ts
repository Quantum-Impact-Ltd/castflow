'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import { cancelBooking, confirmCompletion, getBooking, listMyBookings } from '@/lib/api/bookings'
import { errorMessage } from './util'

export function useMyBookings(filters: { status?: string; cursor?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: [...queryKeys.bookings.artist(), filters],
    queryFn: ({ signal }) => listMyBookings(filters, { signal }),
  })
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(id ?? ''),
    queryFn: ({ signal }) => getBooking(id!, { signal }),
    enabled: Boolean(id),
  })
}

export function useCancelBooking(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reason: string) => cancelBooking(id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) })
      void qc.invalidateQueries({ queryKey: queryKeys.bookings.artist() })
      void qc.invalidateQueries({ queryKey: queryKeys.bookings.caster() })
      toast.success('Booking cancelled')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useConfirmCompletion(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => confirmCompletion(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) })
      toast.success('Completion confirmed — payment will release to the artist')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}
