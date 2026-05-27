'use client'

import Link from 'next/link'
import { ChevronLeft, Download, Receipt } from 'lucide-react'
import {
  PageHeader,
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
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useMyBookings } from '@/lib/hooks/use-bookings'
import { formatDate } from '@/lib/utils'

export default function CasterBillingPage() {
  const { data: bookings, isPending, isError, refetch } = useMyBookings()

  return (
    <div className="space-y-6">
      <Link
        href="/caster/settings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Back to settings
      </Link>

      <PageHeader
        title="Billing"
        description="Every shoot you’ve paid into escrow, with its current status."
      />

      <Card className="flex items-start gap-3 bg-muted/40 p-4">
        <Receipt className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Downloadable PDF invoices are coming soon. In the meantime, each booking detail page shows
          the full payment breakdown for your records.
        </p>
      </Card>

      {isPending ? (
        <LoadingState rows={4} />
      ) : isError ? (
        <ErrorState
          message="We couldn’t load your billing history right now."
          onRetry={() => void refetch()}
        />
      ) : bookings && bookings.length > 0 ? (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shoot</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => {
                const status = booking.payment?.escrowStatus ?? booking.status
                return (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium text-foreground">
                      <Link
                        href={`/caster/bookings/${booking.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {booking.job?.title ?? 'Shoot'}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(booking.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Money amount={booking.totalAmount} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        title="Downloadable invoices are coming soon"
                        className="text-muted-foreground"
                      >
                        <Download className="mr-1.5 h-4 w-4" /> Invoice
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState
          title="No billing history yet"
          description="Once you confirm and pay for a booking, it’ll show up here."
          icon={<Receipt className="h-6 w-6" />}
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/caster/bookings">View bookings</Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
