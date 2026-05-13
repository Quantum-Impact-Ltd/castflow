import type { Contract } from '@castflow/types'
import { fetcher } from '@/lib/fetcher'
import type { Init } from './types'

export function getContract(bookingId: string, init?: Init) {
  return fetcher<Contract>(`/contracts/bookings/${bookingId}`, init)
}

export function generateContract(bookingId: string) {
  return fetcher<Contract>(`/contracts/bookings/${bookingId}/generate`, { method: 'POST' })
}

export function signContract(bookingId: string, signatureName: string) {
  return fetcher<Contract>(`/contracts/bookings/${bookingId}/sign`, {
    method: 'POST',
    body: { signatureName },
  })
}
