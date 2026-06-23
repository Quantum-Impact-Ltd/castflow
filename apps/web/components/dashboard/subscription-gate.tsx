'use client'

import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useStartCheckout } from '@/lib/hooks/use-subscriptions'

interface SubscriptionGateProps {
  /** Headline shown to the caster. */
  title?: string
  /** Supporting copy explaining why a subscription is needed. */
  description?: string
  className?: string
}

/**
 * Shown when a caster lacks an active subscription or hits a
 * SUBSCRIPTION_REQUIRED (HTTP 402) response. Posting a job and accepting a bid
 * both require an active subscription — everything else on the platform is free.
 * The "Subscribe" button starts Stripe Checkout and redirects the browser.
 */
export function SubscriptionGate({
  title = 'A subscription is required',
  description = 'Posting jobs and booking talent need an active CastFlow subscription. Browsing, messaging, contracts, and reviews stay free.',
  className,
}: SubscriptionGateProps) {
  const checkout = useStartCheckout()

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center',
        className
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Lock className="h-6 w-6" />
      </span>
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      <Button onClick={() => checkout.mutate()} disabled={checkout.isPending}>
        {checkout.isPending ? 'Redirecting…' : 'Subscribe'}
      </Button>
    </div>
  )
}
