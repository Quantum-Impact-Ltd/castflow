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

export function submitDisputeEvidence(bookingId: string, submission: string) {
  // The API's submitDisputeSideSchema expects `submission` (min 50 chars).
  return fetcher<Dispute>(`/disputes/bookings/${bookingId}/evidence`, {
    method: 'POST',
    body: { submission },
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
