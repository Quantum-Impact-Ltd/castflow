'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { SubmitBidInput, UpdateBidInput, CounterOfferInput } from '@castflow/validators'
import { queryKeys } from '@/lib/query-keys'
import {
  acceptBid,
  acceptCounterOffer,
  counterBid,
  declineCounterOffer,
  listBidsForJob,
  listMyBids,
  rejectBid,
  shortlistBid,
  submitBid,
  undoRejectBid,
  updateBid,
  withdrawBid,
} from '@/lib/api/bids'
import { errorMessage } from './util'

export function useMyBids(filters: { status?: string; cursor?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: [...queryKeys.artist.bids(), filters],
    queryFn: ({ signal }) => listMyBids(filters, { signal }),
  })
}

export function useBidsForJob(jobId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.bids.forJob(jobId ?? ''),
    queryFn: ({ signal }) => listBidsForJob(jobId!, { signal }),
    enabled: Boolean(jobId),
  })
}

export function useSubmitBid(jobId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SubmitBidInput) => submitBid(jobId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.artist.bids() })
      void qc.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) })
      toast.success('Bid submitted')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useUpdateBid(bidId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateBidInput) => updateBid(bidId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.artist.bids() })
      toast.success('Bid updated')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useWithdrawBid(bidId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => withdrawBid(bidId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.artist.bids() })
      toast.success('Bid withdrawn')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useShortlistBid(jobId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (bidId: string) => shortlistBid(bidId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.bids.forJob(jobId) })
      void qc.invalidateQueries({ queryKey: queryKeys.threads.inbox() })
      toast.success('Artist shortlisted')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useRejectBid(jobId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bidId, reason }: { bidId: string; reason?: string }) => rejectBid(bidId, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.bids.forJob(jobId) })
      toast.success('Bid rejected')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useUndoRejectBid(jobId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (bidId: string) => undoRejectBid(bidId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.bids.forJob(jobId) })
      toast.success('Reject undone')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useAcceptBid(jobId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (bidId: string) => acceptBid(bidId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.bids.forJob(jobId) })
      void qc.invalidateQueries({ queryKey: queryKeys.bookings.caster() })
      toast.success('Bid accepted — booking created')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useCounterOffer(bidId: string) {
  return useMutation({
    mutationFn: (input: CounterOfferInput) => counterBid(bidId, input),
    onSuccess: () => toast.success('Counter offer sent'),
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useAcceptCounterOffer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (counterId: string) => acceptCounterOffer(counterId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.artist.bids() })
      toast.success('Counter accepted')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useDeclineCounterOffer() {
  return useMutation({
    mutationFn: (counterId: string) => declineCounterOffer(counterId),
    onSuccess: () => toast.success('Counter declined'),
    onError: (err) => toast.error(errorMessage(err)),
  })
}
