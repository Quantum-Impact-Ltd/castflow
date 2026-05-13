'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatCard,
  StatusBadge,
} from '@/components/dashboard'
import { useMyBookings } from '@/lib/hooks/use-bookings'
import { useConnectStatus } from '@/lib/hooks/use-payments'
import { formatCurrency, formatDate } from '@/lib/utils'

export function EarningsClient() {
  const bookings = useMyBookings({ limit: 200 })
  const connect = useConnectStatus()

  if (bookings.isPending || connect.isPending) return <LoadingState rows={5} />
  if (bookings.isError) return <ErrorState onRetry={() => bookings.refetch()} />

  const rows = bookings.data ?? []
  const released = rows.filter((b) => b.payment?.escrowStatus === 'released')
  const pending = rows.filter((b) => b.payment?.escrowStatus === 'held')

  const totalEarned = released.reduce((sum, b) => sum + (b.payment?.netArtistAmount ?? 0), 0)
  const pendingPayout = pending.reduce((sum, b) => sum + (b.payment?.netArtistAmount ?? 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Earnings"
        description="Track every booking and payout."
        actions={
          <Button asChild variant={connect.data?.payoutsEnabled ? 'outline' : 'default'}>
            <Link href="/artist/earnings/payout">
              {connect.data?.payoutsEnabled ? 'Payout settings' : 'Set up payouts'}
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total earned" value={formatCurrency(totalEarned)} />
        <StatCard label="Pending payout" value={formatCurrency(pendingPayout)} />
        <StatCard
          label="Payouts"
          value={connect.data?.payoutsEnabled ? 'Enabled' : 'Not set up'}
          hint={connect.data?.payoutsEnabled ? 'Stripe Connect linked' : 'Action required'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per-booking breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState title="No earnings yet" description="Complete a shoot to earn." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-border border-b text-left text-xs uppercase">
                    <th className="py-2">Shoot</th>
                    <th className="py-2">Gross</th>
                    <th className="py-2">Commission</th>
                    <th className="py-2">Net</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((b) => {
                    const p = b.payment
                    return (
                      <tr key={b.id} className="border-border border-b">
                        <td className="py-3">
                          <Link href={`/artist/bookings/${b.id}`} className="hover:underline">
                            {formatDate(b.shootDate)}
                          </Link>
                        </td>
                        <td className="py-3">
                          {p ? formatCurrency(p.grossAmount) : formatCurrency(b.totalAmount)}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {p ? `−${formatCurrency(p.platformCommissionAmount)}` : '—'}
                        </td>
                        <td className="py-3 font-medium">
                          {p ? formatCurrency(p.netArtistAmount) : '—'}
                        </td>
                        <td className="py-3 text-right">
                          {p ? (
                            <StatusBadge status={p.escrowStatus} />
                          ) : (
                            <StatusBadge status="pending" />
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
