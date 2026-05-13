import { fetcher } from '@/lib/fetcher'
import type { Init } from './types'

export interface EscrowIntent {
  clientSecret: string
  paymentIntentId: string
}

export interface ConnectStatus {
  connected: boolean
  accountId: string | null
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  requirementsDue: string[]
}

export interface ConnectOnboardingLink {
  url: string
  expiresAt: string
}

export function createEscrowIntent(bookingId: string) {
  return fetcher<EscrowIntent>(`/payments/bookings/${bookingId}/intent`, { method: 'POST' })
}

export function releaseEscrow(bookingId: string) {
  return fetcher<unknown>(`/payments/bookings/${bookingId}/release`, { method: 'POST' })
}

export function startConnectOnboarding() {
  return fetcher<ConnectOnboardingLink>('/payments/connect/onboard', { method: 'POST' })
}

export function getConnectStatus(init?: Init) {
  return fetcher<ConnectStatus>('/payments/connect/status', init)
}
