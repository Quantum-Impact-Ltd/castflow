'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ErrorState, LoadingState, PageHeader, StatusBadge } from '@/components/dashboard'
import { useConnectStatus, useStartConnectOnboarding } from '@/lib/hooks/use-payments'

export function PayoutSetupClient() {
  const status = useConnectStatus()
  const start = useStartConnectOnboarding()
  const [, setRedirecting] = useState(false)

  // Surface the ?completed=1 / ?refresh=1 query params from Stripe's redirect.
  const [returned, setReturned] = useState<'completed' | 'refresh' | null>(null)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sp = new URLSearchParams(window.location.search)
    if (sp.get('completed')) setReturned('completed')
    else if (sp.get('refresh')) setReturned('refresh')
  }, [])

  async function handleStart() {
    setRedirecting(true)
    try {
      const { url } = await start.mutateAsync()
      window.location.href = url
    } catch {
      setRedirecting(false)
    }
  }

  if (status.isPending) return <LoadingState rows={4} />
  if (status.isError) return <ErrorState onRetry={() => status.refetch()} />

  const s = status.data

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Payout settings"
        description="Connect your UK bank account via Stripe Connect to receive payouts."
      />

      {returned === 'completed' ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 text-sm text-green-900">
            Onboarding submitted. We'll enable payouts once Stripe finishes verification.
          </CardContent>
        </Card>
      ) : returned === 'refresh' ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6 text-sm text-amber-900">
            Your onboarding session expired. Click "Continue setup" to resume.
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stripe Connect</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Connected</span>
            <StatusBadge status={s.connected ? 'active' : 'pending'} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Payouts enabled</span>
            <StatusBadge status={s.payoutsEnabled ? 'active' : 'pending'} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Details submitted</span>
            <StatusBadge status={s.detailsSubmitted ? 'active' : 'pending'} />
          </div>
          {s.requirementsDue?.length ? (
            <div className="border-border border-t pt-3">
              <div className="text-muted-foreground mb-1 text-xs">Still required by Stripe</div>
              <ul className="list-disc pl-5 text-xs">
                {s.requirementsDue.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <Button onClick={handleStart} disabled={start.isPending}>
            {s.connected ? 'Continue setup' : 'Start onboarding'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
