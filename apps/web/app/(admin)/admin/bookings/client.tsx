'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from '@/components/dashboard'
import { useAdminBookings } from '@/lib/hooks/use-admin'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUSES = [
  'all',
  'pending_payment',
  'confirmed',
  'completed',
  'cancelled',
  'disputed',
] as const

export function AdminBookingsClient() {
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('all')
  const bookings = useAdminBookings(status === 'all' ? { limit: 100 } : { status, limit: 100 })

  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" />
      <Tabs value={status} onValueChange={(v) => setStatus(v as (typeof STATUSES)[number])}>
        <TabsList>
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s.replace(/_/g, ' ')}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {bookings.isPending ? (
        <LoadingState rows={4} />
      ) : bookings.isError ? (
        <ErrorState onRetry={() => bookings.refetch()} />
      ) : !bookings.data?.length ? (
        <EmptyState title="No matching bookings" />
      ) : (
        <ul className="space-y-2">
          {bookings.data.map((b) => (
            <li key={b.id}>
              <Link href={`/admin/bookings/${b.id}`}>
                <Card className="hover:border-primary/40 transition-colors">
                  <CardContent className="flex items-center justify-between gap-3 pt-6 text-sm">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {formatDate(b.shootDate)} · {formatCurrency(b.totalAmount)}
                      </div>
                      <div className="text-muted-foreground text-xs">{b.paymentType}</div>
                    </div>
                    <StatusBadge status={b.status} />
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
