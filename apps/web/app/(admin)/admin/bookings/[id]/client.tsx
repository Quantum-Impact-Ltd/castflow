'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState, LoadingState, PageHeader, StatusBadge } from '@/components/dashboard'
import { useAdminBooking } from '@/lib/hooks/use-admin'
import { formatCurrency, formatDate } from '@/lib/utils'

export function AdminBookingDetailClient({ id }: { id: string }) {
  const booking = useAdminBooking(id)
  if (booking.isPending) return <LoadingState rows={5} />
  if (booking.isError || !booking.data) return <ErrorState onRetry={() => booking.refetch()} />
  const b = booking.data
  return (
    <div className="space-y-6">
      <PageHeader title="Booking" description={formatDate(b.shootDate)} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Status" value={<StatusBadge status={b.status} />} />
          <Row label="Payment type" value={b.paymentType} />
          <Row label="Rate" value={formatCurrency(b.agreedRate)} />
          <Row label="Total" value={formatCurrency(b.totalAmount)} />
          {b.contract ? (
            <Row label="Contract" value={<StatusBadge status={b.contract.status} />} />
          ) : null}
          {b.payment ? (
            <Row label="Escrow" value={<StatusBadge status={b.payment.escrowStatus} />} />
          ) : null}
          {b.cancellationReason ? (
            <Row label="Cancellation reason" value={b.cancellationReason} />
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="capitalize">{value}</span>
    </div>
  )
}
