'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '@/components/dashboard'
import { useMyBookings } from '@/lib/hooks/use-bookings'
import { formatCurrency, formatDate } from '@/lib/utils'

export function ArtistBookingsList() {
  const bookings = useMyBookings({ limit: 100 })

  if (bookings.isPending) return <LoadingState rows={5} />
  if (bookings.isError) return <ErrorState onRetry={() => bookings.refetch()} />
  if (!bookings.data?.length) {
    return (
      <EmptyState
        title="No bookings yet"
        description="When a caster accepts one of your bids, the booking appears here."
      />
    )
  }

  return (
    <ul className="space-y-3">
      {bookings.data.map((b) => (
        <li key={b.id}>
          <Link href={`/artist/bookings/${b.id}`}>
            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="flex items-center justify-between gap-3 pt-6 text-sm">
                <div className="space-y-1">
                  <div className="font-medium">{formatDate(b.shootDate)}</div>
                  <div className="text-muted-foreground text-xs">
                    {formatCurrency(b.totalAmount)} · {b.paymentType}
                  </div>
                </div>
                <StatusBadge status={b.status} />
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  )
}
