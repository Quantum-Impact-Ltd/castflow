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

/**
 * Fetch a short-lived presigned URL for the signed contract PDF. The contracts
 * bucket is private, so `contract.pdfUrl` (an s3:// key) is not browser-openable
 * — call this on demand to get a real, time-limited download URL.
 */
export function getContractPdfUrl(bookingId: string, init?: Init) {
  return fetcher<{ url: string; expiresIn: number }>(
    `/contracts/bookings/${bookingId}/pdf-url`,
    init
  )
}
