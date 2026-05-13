'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import {
  getDispute,
  raiseDispute,
  resolveDispute,
  submitDisputeEvidence,
  type RaiseDisputeInput,
  type ResolveDisputeInput,
} from '@/lib/api/disputes'
import { errorMessage } from './util'

export function useDispute(bookingId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.dispute.forBooking(bookingId ?? ''),
    queryFn: ({ signal }) => getDispute(bookingId!, { signal }),
    enabled: Boolean(bookingId),
    retry: false,
  })
}

export function useRaiseDispute(bookingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: RaiseDisputeInput) => raiseDispute(bookingId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.dispute.forBooking(bookingId) })
      void qc.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) })
      toast.success('Dispute opened')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useSubmitDisputeEvidence(bookingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => submitDisputeEvidence(bookingId, content),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.dispute.forBooking(bookingId) })
      toast.success('Evidence submitted')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useResolveDispute(bookingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ResolveDisputeInput) => resolveDispute(bookingId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.dispute.forBooking(bookingId) })
      toast.success('Dispute resolved')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}
