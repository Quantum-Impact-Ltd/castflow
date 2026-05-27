'use client'

import Link from 'next/link'
import { CalendarCheck } from 'lucide-react'
import {
  PageHeader,
  StatusBadge,
  LoadingState,
  ErrorState,
  EmptyState,
  Money,
} from '@/components/dashboard'
import { Button } from '@/components/ui/button'
import { useMyBookings } from '@/lib/hooks/use-bookings'
import { formatDate } from '@/lib/utils'

export default function CasterBookingsPage() {
  const { data: bookings, isPending, isError, refetch } = useMyBookings()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description="Artists you’ve booked — contracts, escrow, and reviews live here."
      />

      {isPending ? (
        <LoadingState rows={4} />
      ) : isError ? (
        <ErrorState
          message="We couldn’t load your bookings right now."
          onRetry={() => void refetch()}
        />
      ) : bookings && bookings.length > 0 ? (
        <ul className="space-y-3">
          {bookings.map((booking) => {
            const fullySigned = booking.contract?.status === 'fully_signed'
            const artistName = booking.artist
              ? fullySigned
                ? `${booking.artist.firstName} ${booking.artist.lastName}`
                : booking.artist.firstName
              : 'Artist'

            return (
              <li key={booking.id}>
                <Link
                  href={`/caster/bookings/${booking.id}`}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate font-medium text-foreground">
                      {booking.job?.title ?? 'Shoot'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {artistName} · {formatDate(booking.shootDate)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-6 sm:justify-end">
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        <Money amount={booking.totalAmount} />
                      </p>
                      <p className="text-xs text-muted-foreground">Agreed rate</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusBadge status={booking.status} />
                      {booking.payment?.escrowStatus ? (
                        <StatusBadge status={booking.payment.escrowStatus} />
                      ) : null}
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState
          title="No bookings yet"
          description="When you accept an artist’s bid, the confirmed booking will appear here."
          icon={<CalendarCheck className="h-6 w-6" />}
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/caster/talent">Browse talent</Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
