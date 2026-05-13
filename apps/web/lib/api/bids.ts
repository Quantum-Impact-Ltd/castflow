import type { Bid } from '@castflow/types'
import type { SubmitBidInput, UpdateBidInput, CounterOfferInput } from '@castflow/validators'
import { fetcher } from '@/lib/fetcher'
import type { Init } from './types'

export function submitBid(jobId: string, input: SubmitBidInput) {
  return fetcher<Bid>(`/bids/jobs/${jobId}`, { method: 'POST', body: input })
}

export function updateBid(bidId: string, input: UpdateBidInput) {
  return fetcher<Bid>(`/bids/${bidId}`, { method: 'PATCH', body: input })
}

export function withdrawBid(bidId: string) {
  return fetcher<Bid>(`/bids/${bidId}/withdraw`, { method: 'POST' })
}

export function listMyBids(
  filters: { status?: string; cursor?: string; limit?: number } = {},
  init?: Init
) {
  return fetcher<Bid[]>('/bids/me/list', { params: filters, ...init })
}

export function listBidsForJob(jobId: string, init?: Init) {
  return fetcher<Bid[]>(`/bids/jobs/${jobId}/list`, init)
}

export function shortlistBid(bidId: string) {
  return fetcher<Bid>(`/bids/${bidId}/shortlist`, { method: 'POST' })
}

export function rejectBid(bidId: string, rejectionReason?: string) {
  return fetcher<Bid>(`/bids/${bidId}/reject`, {
    method: 'POST',
    body: { rejectionReason },
  })
}

export function undoRejectBid(bidId: string) {
  return fetcher<Bid>(`/bids/${bidId}/undo-reject`, { method: 'POST' })
}

export function acceptBid(bidId: string) {
  return fetcher<{ bookingId: string }>(`/bids/${bidId}/accept`, { method: 'POST' })
}

export function counterBid(bidId: string, input: CounterOfferInput) {
  return fetcher<unknown>(`/bids/${bidId}/counter`, { method: 'POST', body: input })
}

export function acceptCounterOffer(counterId: string) {
  return fetcher<unknown>(`/bids/counter/${counterId}/accept`, { method: 'POST' })
}

export function declineCounterOffer(counterId: string) {
  return fetcher<unknown>(`/bids/counter/${counterId}/decline`, { method: 'POST' })
}
