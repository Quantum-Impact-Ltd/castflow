import type { Booking } from '@castflow/types'
import { fetcher } from '@/lib/fetcher'
import type { Init } from './types'

export function listMyBookings(
  filters: { status?: string; cursor?: string; limit?: number } = {},
  init?: Init
) {
  return fetcher<Booking[]>('/bookings/me/list', { params: filters, ...init })
}

export function getBooking(id: string, init?: Init) {
  return fetcher<Booking>(`/bookings/${id}`, init)
}

export function cancelBooking(id: string, reason: string) {
  return fetcher<Booking>(`/bookings/${id}/cancel`, { method: 'POST', body: { reason } })
}

export function confirmCompletion(id: string) {
  return fetcher<Booking>(`/bookings/${id}/confirm-completion`, { method: 'POST' })
}
