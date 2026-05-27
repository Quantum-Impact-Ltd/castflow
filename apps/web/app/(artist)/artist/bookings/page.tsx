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

export default function ArtistBookingsPage() {
  const { data: bookings, isPending, isError, refetch } = useMyBookings()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your bookings"
        description="Shoots you’ve been booked for — contracts, payouts, and reviews live here."
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
          {bookings.map((booking) => (
            <li key={booking.id}>
              <Link
                href={`/artist/bookings/${booking.id}`}
                className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-medium text-foreground">
                    {booking.job?.title ?? 'Shoot'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {booking.caster?.companyName ?? 'CastFlow caster'} ·{' '}
                    {formatDate(booking.shootDate)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-6 sm:justify-end">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      <Money amount={booking.agreedRate} />
                      {booking.paymentType === 'hourly' ? '/hr' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Net <Money amount={booking.payment?.netArtistAmount} />
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No bookings yet"
          description="When a caster accepts your bid, the confirmed booking will appear here."
          icon={<CalendarCheck className="h-6 w-6" />}
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/artist/jobs">Browse the job feed</Link>
            </Button>
          }
        />
      )}
    </div>
  )
}
