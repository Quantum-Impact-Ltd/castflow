'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '@/components/dashboard'
import { useMyBids } from '@/lib/hooks/use-bids'
import { useMyBookings } from '@/lib/hooks/use-bookings'
import { useMyInvites } from '@/lib/hooks/use-invites'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ApiError } from '@/lib/fetcher'

function errorProps(err: unknown, retry: () => void) {
  if (err instanceof ApiError && err.code === 'FORBIDDEN') {
    return { title: 'Account not approved yet', message: err.message }
  }
  return { onRetry: retry }
}

export function ArtistDashboardClient() {
  const bids = useMyBids({ status: 'pending', limit: 5 })
  const bookings = useMyBookings({ limit: 5 })
  const invites = useMyInvites({ status: 'pending', limit: 5 })

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent bids</CardTitle>
        </CardHeader>
        <CardContent>
          {bids.isPending ? (
            <LoadingState rows={3} />
          ) : bids.isError ? (
            <ErrorState {...errorProps(bids.error, () => bids.refetch())} />
          ) : !bids.data?.length ? (
            <EmptyState
              title="No bids yet"
              description="Browse open jobs and submit your first bid."
              action={
                <Button asChild size="sm">
                  <Link href="/artist/jobs">Browse jobs</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-border divide-y">
              {bids.data.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-3 text-sm">
                  <Link href={`/artist/bids/${b.id}`} className="flex-1 hover:underline">
                    {formatCurrency(b.proposedRate)} · {formatDate(b.submittedAt)}
                  </Link>
                  <StatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.isPending ? (
            <LoadingState rows={3} />
          ) : bookings.isError ? (
            <ErrorState {...errorProps(bookings.error, () => bookings.refetch())} />
          ) : !bookings.data?.length ? (
            <EmptyState title="No bookings yet" description="Your shoots will appear here." />
          ) : (
            <ul className="divide-border divide-y">
              {bookings.data.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-3 text-sm">
                  <Link href={`/artist/bookings/${b.id}`} className="flex-1 hover:underline">
                    {formatDate(b.shootDate)} · {formatCurrency(b.totalAmount)}
                  </Link>
                  <StatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Pending invites</CardTitle>
        </CardHeader>
        <CardContent>
          {invites.isPending ? (
            <LoadingState rows={2} />
          ) : invites.isError ? (
            <ErrorState {...errorProps(invites.error, () => invites.refetch())} />
          ) : !invites.data?.length ? (
            <EmptyState
              title="No invites"
              description="Casters can invite you to private jobs directly."
            />
          ) : (
            <ul className="divide-border divide-y">
              {invites.data.map((i) => (
                <li key={i.id} className="flex items-center justify-between py-3 text-sm">
                  <Link href={`/artist/jobs/${i.jobId}`} className="flex-1 hover:underline">
                    {i.job?.title ?? 'Private job'}
                  </Link>
                  <StatusBadge status={i.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
