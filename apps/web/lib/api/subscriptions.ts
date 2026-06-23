import type { SubscriptionStatus } from '@castflow/types'
import { fetcher } from '@/lib/fetcher'
import type { Init } from './types'

/** Caster subscription status as surfaced by GET /subscriptions/status. */
export interface SubscriptionStatusResponse {
  status: SubscriptionStatus | 'none'
  priceId?: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  hasCustomer: boolean
  isActive: boolean
}

/** A Stripe-hosted URL the browser should be redirected to. */
export interface RedirectUrl {
  url: string
}

export function getSubscriptionStatus(init?: Init) {
  return fetcher<SubscriptionStatusResponse>('/subscriptions/status', init)
}

export function startCheckout() {
  return fetcher<RedirectUrl>('/subscriptions/checkout', { method: 'POST' })
}

export function openBillingPortal() {
  return fetcher<RedirectUrl>('/subscriptions/portal', { method: 'POST' })
}
