'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, CheckCircle2, CreditCard, XCircle } from 'lucide-react'
import { PageHeader, StatusBadge, LoadingState, ErrorState } from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  useSubscriptionStatus,
  useStartCheckout,
  useOpenBillingPortal,
} from '@/lib/hooks/use-subscriptions'
import { formatDate } from '@/lib/utils'

export default function CasterBillingPage() {
  const { data, isPending, isError, refetch } = useSubscriptionStatus()
  const checkout = useStartCheckout()
  const portal = useOpenBillingPortal()
  const searchParams = useSearchParams()
  const checkoutResult = searchParams.get('checkout')

  return (
    <div className="space-y-6">
      <Link
        href="/caster/settings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to settings
      </Link>

      <PageHeader
        title="Subscription"
        description="CastFlow charges a single recurring subscription. Job fees are settled directly with the artist, off-platform."
      />

      {checkoutResult === 'success' ? (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          Thanks for subscribing. Your subscription is now active — it may take a moment to reflect
          below.
        </div>
      ) : null}
      {checkoutResult === 'cancelled' ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Checkout was cancelled. You haven’t been charged.
        </div>
      ) : null}

      {isPending ? (
        <LoadingState variant="detail" />
      ) : isError ? (
        <ErrorState
          message="We couldn’t load your subscription right now."
          onRetry={() => void refetch()}
        />
      ) : (
        <Card className="space-y-5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Current plan</h2>
            {data.status === 'none' ? (
              <StatusBadge status="inactive" />
            ) : (
              <StatusBadge status={data.status} />
            )}
          </div>

          {data.isActive ? (
            <p className="text-sm text-muted-foreground">
              Your subscription is active. You can post jobs and book talent.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              You need an active subscription to post jobs and accept bids. Browsing, messaging,
              contracts, and reviews stay free.
            </p>
          )}

          {data.currentPeriodEnd ? (
            <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
              <span className="text-muted-foreground">
                {data.cancelAtPeriodEnd ? 'Access ends' : 'Renews'}
              </span>
              <span className="font-medium text-foreground">
                {formatDate(data.currentPeriodEnd)}
              </span>
            </div>
          ) : null}

          {data.cancelAtPeriodEnd ? (
            <p className="text-xs text-muted-foreground">
              Your subscription is set to cancel at the end of the current period. You’ll keep access
              until then.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3 border-t border-border pt-4">
            {!data.isActive ? (
              <Button onClick={() => checkout.mutate()} disabled={checkout.isPending}>
                <CreditCard className="mr-1.5 h-4 w-4" />
                {checkout.isPending ? 'Redirecting…' : 'Subscribe'}
              </Button>
            ) : null}
            {data.hasCustomer ? (
              <Button
                variant="outline"
                onClick={() => portal.mutate()}
                disabled={portal.isPending}
              >
                {portal.isPending ? 'Redirecting…' : 'Manage billing'}
              </Button>
            ) : null}
          </div>
        </Card>
      )}
    </div>
  )
}
