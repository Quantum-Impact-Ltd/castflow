import type {
  Bid,
  Booking,
  JobPaymentType,
  JobStatus,
  ArtistType,
  PortfolioItem,
} from '@castflow/types'
import type { SubmitBidInput, UpdateBidInput, CounterOfferInput } from '@castflow/validators'
import { fetcher } from '@/lib/fetcher'
import type { Init } from './types'

/** A bid as the owning caster sees it — carries the artist preview the API
 *  includes (first name only, no surname, plus rating + sample portfolio). */
export interface BidForCaster extends Omit<Bid, 'artist'> {
  artist?: {
    id: string
    firstName: string
    artistType: ArtistType
    city: string | null
    ratingAvg: number | null
    ratingCount: number
    portfolioItems?: PortfolioItem[]
  }
}

/** A bid as returned by the artist's own list — carries a slim job relation. */
export interface BidWithJob extends Bid {
  job?: {
    id: string
    title: string
    paymentType: JobPaymentType
    shootDate: string
    applicationDeadline: string
    status: JobStatus
  }
}

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
  return fetcher<BidWithJob[]>('/bids/me/list', { params: filters, ...init })
}

export function listBidsForJob(jobId: string, init?: Init) {
  return fetcher<BidForCaster[]>(`/bids/jobs/${jobId}/list`, init)
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

export function acceptBid(bidId: string, shootLocation: string) {
  // The API requires a shoot location on accept (it's locked onto the booking),
  // and returns the created Booking. Read `.id` from it for navigation.
  return fetcher<Booking>(`/bids/${bidId}/accept`, {
    method: 'POST',
    body: { shootLocation },
  })
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
