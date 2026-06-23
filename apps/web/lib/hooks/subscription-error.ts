import { toast } from 'sonner'
import { ApiError } from '@/lib/fetcher'

/**
 * True when an error is the API's SUBSCRIPTION_REQUIRED response (HTTP 402).
 * Posting a job and accepting a bid both require an active caster subscription.
 */
export function isSubscriptionRequired(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.code === 'SUBSCRIPTION_REQUIRED' || err.status === 402
  }
  return false
}

/**
 * If `err` is a SUBSCRIPTION_REQUIRED (402), surface a toast that routes the
 * caster to the billing page to subscribe, and return `true` (handled). Callers
 * fall back to their generic error toast when this returns `false`.
 *
 * Without this, the 402 collapses into a generic "something went wrong" toast
 * with no recovery path — a dead end on the platform's only revenue flow.
 */
export function handleSubscriptionError(err: unknown): boolean {
  if (!isSubscriptionRequired(err)) return false
  toast.error('An active subscription is required', {
    description:
      'Posting jobs and booking talent need a CastFlow subscription. Browsing, messaging, contracts, and reviews stay free.',
    action: {
      label: 'Subscribe',
      onClick: () => {
        window.location.href = '/caster/settings/billing'
      },
    },
  })
  return true
}
