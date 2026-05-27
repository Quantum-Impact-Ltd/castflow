'use client'

import Link from 'next/link'
import {
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Landmark,
} from 'lucide-react'
import { PageHeader, LoadingState, ErrorState } from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useConnectStatus, useStartConnectOnboarding } from '@/lib/hooks/use-payments'

type PayoutState = 'not_connected' | 'pending' | 'enabled'

function deriveState(connected: boolean, payoutsEnabled: boolean): PayoutState {
  if (!connected) return 'not_connected'
  if (payoutsEnabled) return 'enabled'
  return 'pending'
}

const STATE_COPY: Record<
  PayoutState,
  { badge: string; tone: 'neutral' | 'warning' | 'success'; title: string; body: string }
> = {
  not_connected: {
    badge: 'Not connected',
    tone: 'neutral',
    title: 'Connect a bank account to receive payouts',
    body: 'CastFlow uses Stripe to pay you securely. Set up your account once and we’ll handle the rest.',
  },
  pending: {
    badge: 'Details pending',
    tone: 'warning',
    title: 'Your account needs more details',
    body: 'You’ve started onboarding but Stripe still needs a few things before payouts can be enabled.',
  },
  enabled: {
    badge: 'Payouts enabled',
    tone: 'success',
    title: 'You’re all set to get paid',
    body: 'Released funds arrive in your bank account 2–3 business days after a shoot’s escrow is released.',
  },
}

const TONE_CLASS: Record<'neutral' | 'warning' | 'success', string> = {
  neutral: 'bg-muted text-muted-foreground border-border',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const STATE_ICON: Record<PayoutState, typeof CheckCircle2> = {
  not_connected: Landmark,
  pending: Clock,
  enabled: CheckCircle2,
}

export default function ArtistPayoutPage() {
  const connect = useConnectStatus()
  const start = useStartConnectOnboarding()

  const handleSetup = () => {
    start.mutate(undefined, {
      onSuccess: (data) => {
        window.location.href = data.url
      },
    })
  }

  return (
    <div className="space-y-6">
      <Link
        href="/artist/earnings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to earnings
      </Link>

      <PageHeader
        title="Payouts"
        description="Manage how you get paid for completed shoots."
      />

      {connect.isPending ? (
        <LoadingState rows={2} variant="detail" />
      ) : connect.isError || !connect.data ? (
        <ErrorState
          message="We couldn’t load your payout status."
          onRetry={() => void connect.refetch()}
        />
      ) : (
        (() => {
          const state = deriveState(connect.data.connected, connect.data.payoutsEnabled)
          const copy = STATE_COPY[state]
          const Icon = STATE_ICON[state]
          const requirements = connect.data.requirementsDue ?? []

          return (
            <Card className="space-y-6 p-6">
              <div className="flex items-start gap-4">
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${TONE_CLASS[copy.tone]}`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">{copy.title}</h2>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE_CLASS[copy.tone]}`}
                    >
                      {copy.badge}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{copy.body}</p>
                </div>
              </div>

              <dl className="grid gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-2">
                <div className="flex items-center justify-between sm:flex-col sm:items-start sm:gap-1">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Account
                  </dt>
                  <dd className="text-sm font-medium text-foreground">
                    {connect.data.connected ? 'Connected' : 'Not connected'}
                  </dd>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-start sm:gap-1">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Details submitted
                  </dt>
                  <dd className="text-sm font-medium text-foreground">
                    {connect.data.detailsSubmitted ? 'Yes' : 'No'}
                  </dd>
                </div>
              </dl>

              {requirements.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="text-sm font-medium">Stripe still needs:</p>
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {requirements.map((req) => (
                      <li key={req}>
                        <Badge variant="outline" className="font-normal">
                          {req.replace(/[._]/g, ' ')}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Payouts arrive 2–3 business days after a shoot’s escrow is released.
                </p>
                <Button onClick={handleSetup} disabled={start.isPending}>
                  {start.isPending
                    ? 'Opening Stripe…'
                    : state === 'enabled'
                      ? 'Manage payouts'
                      : 'Set up payouts'}
                </Button>
              </div>
            </Card>
          )
        })()
      )}
    </div>
  )
}
