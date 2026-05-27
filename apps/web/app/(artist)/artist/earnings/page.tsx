'use client'

import Link from 'next/link'
import { Wallet, BadgePoundSterling, Clock, ArrowRight } from 'lucide-react'
import {
  PageHeader,
  StatCard,
  StatusBadge,
  LoadingState,
  ErrorState,
  EmptyState,
  Money,
} from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { useMyBookings } from '@/lib/hooks/use-bookings'
import { useConnectStatus } from '@/lib/hooks/use-payments'

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0
  const n = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(n) ? n : 0
}

export default function ArtistEarningsPage() {
  const bookings = useMyBookings()
  const connect = useConnectStatus()

  if (bookings.isPending) return <LoadingState rows={4} />
  if (bookings.isError || !bookings.data) {
    return (
      <ErrorState
        message="We couldn’t load your earnings."
        onRetry={() => void bookings.refetch()}
      />
    )
  }

  const paidBookings = bookings.data.filter((b) => b.payment)

  const totalEarned = paidBookings.reduce(
    (sum, b) =>
      b.payment?.escrowStatus === 'released'
        ? sum + toNumber(b.payment.netArtistAmount)
        : sum,
    0,
  )
  const pendingEscrow = paidBookings.reduce(
    (sum, b) =>
      b.payment?.escrowStatus === 'held'
        ? sum + toNumber(b.payment.grossAmount)
        : sum,
    0,
  )
  // Paid out = funds that have actually been released to the artist. Same set
  // as "total earned" (released net amounts) — labelled separately so the
  // artist can see the distinction between earned-and-banked vs in-flight.
  const paidOut = totalEarned

  const showPayoutPrompt = Boolean(connect.data && !connect.data.payoutsEnabled)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Earnings"
        description="Track what you’ve earned, what’s still in escrow, and what’s been paid out."
        actions={
          <Button asChild variant="outline">
            <Link href="/artist/earnings/payout">
              Manage payouts <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {showPayoutPrompt ? (
        <Card className="flex flex-col gap-3 border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <p className="font-medium text-amber-900">Set up payouts to get paid</p>
              <p className="text-sm text-amber-800">
                Connect a bank account so released funds can reach you.
              </p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link href="/artist/earnings/payout">Set up payouts</Link>
          </Button>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total earned"
          value={<Money amount={totalEarned} />}
          hint="Net of platform commission, across released payments."
          icon={BadgePoundSterling}
        />
        <StatCard
          label="Pending escrow"
          value={<Money amount={pendingEscrow} />}
          hint="Gross amounts held securely until each shoot completes."
          icon={Clock}
          accent={pendingEscrow > 0}
        />
        <StatCard
          label="Paid out"
          value={<Money amount={paidOut} />}
          hint="Released to your connected bank account."
          icon={Wallet}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Payments by booking</h2>
        {paidBookings.length === 0 ? (
          <EmptyState
            title="No payments yet"
            description="When a caster pays into escrow for one of your bookings, it’ll appear here with its gross, commission, and net breakdown."
            icon={<BadgePoundSterling className="h-6 w-6" />}
          />
        ) : (
          <Card className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paidBookings.map((b) => {
                  const payment = b.payment!
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium text-foreground">
                        <Link
                          href={`/artist/bookings/${b.id}`}
                          className="hover:underline"
                        >
                          {b.job?.title ?? 'Booking'}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <Money amount={payment.grossAmount} />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        −<Money amount={payment.platformCommissionAmount} />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <Money amount={payment.netArtistAmount} />
                      </TableCell>
                      <TableCell className="text-right">
                        <StatusBadge status={payment.escrowStatus} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>
    </div>
  )
}
