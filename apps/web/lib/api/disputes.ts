import type { Dispute, DisputeResolution } from '@castflow/types'
import { fetcher } from '@/lib/fetcher'
import type { Init } from './types'

export interface RaiseDisputeInput {
  reason: string
  description: string
}

export function raiseDispute(bookingId: string, input: RaiseDisputeInput) {
  return fetcher<Dispute>(`/disputes/bookings/${bookingId}`, {
    method: 'POST',
    body: input,
  })
}

export function getDispute(bookingId: string, init?: Init) {
  return fetcher<Dispute>(`/disputes/bookings/${bookingId}`, init)
}

export function submitDisputeEvidence(bookingId: string, content: string) {
  return fetcher<Dispute>(`/disputes/bookings/${bookingId}/evidence`, {
    method: 'POST',
    body: { content },
  })
}

export interface ResolveDisputeInput {
  resolution: DisputeResolution
  adminNotes: string
  splitArtistPct?: number
}

export function resolveDispute(bookingId: string, input: ResolveDisputeInput) {
  return fetcher<Dispute>(`/disputes/bookings/${bookingId}/resolve`, {
    method: 'POST',
    body: input,
  })
}
