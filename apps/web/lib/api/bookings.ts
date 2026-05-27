import type { Booking, ArtistType, JobPaymentType } from '@castflow/types'
import { fetcher } from '@/lib/fetcher'
import type { Init } from './types'

/**
 * Bookings come back with slim relations included. `shootLocation`/`callTime`
 * are masked server-side ('' / null) until the contract is `fully_signed`.
 */
export interface BookingWithRelations extends Booking {
  job?: { id?: string; title: string; paymentType?: JobPaymentType }
  caster?: { id?: string; userId?: string; companyName: string }
  artist?: {
    id?: string
    userId?: string
    firstName: string
    lastName: string
    artistType?: ArtistType
  }
}

export function listMyBookings(
  filters: { status?: string; cursor?: string; limit?: number } = {},
  init?: Init
) {
  return fetcher<BookingWithRelations[]>('/bookings/me/list', { params: filters, ...init })
}

export function getBooking(id: string, init?: Init) {
  return fetcher<BookingWithRelations>(`/bookings/${id}`, init)
}

export function cancelBooking(id: string, reason: string) {
  return fetcher<Booking>(`/bookings/${id}/cancel`, { method: 'POST', body: { reason } })
}

export function confirmCompletion(id: string) {
  return fetcher<Booking>(`/bookings/${id}/confirm-completion`, { method: 'POST' })
}
