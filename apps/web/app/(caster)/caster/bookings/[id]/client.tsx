'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ErrorState, LoadingState, PageHeader, StatusBadge } from '@/components/dashboard'
import { useBooking, useCancelBooking } from '@/lib/hooks/use-bookings'
import { formatCurrency, formatDate } from '@/lib/utils'

export function CasterBookingDetailClient({ id }: { id: string }) {
  const booking = useBooking(id)
  const cancel = useCancelBooking(id)
  const [reason, setReason] = useState('')
  const [open, setOpen] = useState(false)

  if (booking.isPending) return <LoadingState rows={6} />
  if (booking.isError || !booking.data) return <ErrorState onRetry={() => booking.refetch()} />
  const b = booking.data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Booking detail"
        description={formatDate(b.shootDate)}
        actions={
          <div className="flex flex-wrap gap-2">
            {b.payment?.escrowStatus === 'awaiting_payment' ? (
              <Button asChild>
                <Link href={`/caster/bookings/${b.id}/pay`}>Pay into escrow</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href={`/caster/bookings/${b.id}/contract`}>Contract</Link>
            </Button>
            {b.status === 'confirmed' ? (
              <Button asChild variant="outline">
                <Link href={`/caster/bookings/${b.id}/confirm`}>Confirm completion</Link>
              </Button>
            ) : null}
            {b.status === 'completed' ? (
              <Button asChild variant="outline">
                <Link href={`/caster/bookings/${b.id}/review`}>Leave review</Link>
              </Button>
            ) : null}
            {b.status === 'completed' || b.status === 'confirmed' ? (
              <Button asChild variant="outline">
                <Link href={`/caster/bookings/${b.id}/dispute`}>Raise dispute</Link>
              </Button>
            ) : null}
            {b.status === 'pending_payment' || b.status === 'confirmed' ? (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">Cancel</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel this booking?</DialogTitle>
                  </DialogHeader>
                  <Textarea
                    placeholder="Reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Keep
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={!reason.trim() || cancel.isPending}
                      onClick={async () => {
                        await cancel.mutateAsync(reason)
                        setOpen(false)
                      }}
                    >
                      Confirm cancellation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : null}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Shoot details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Date" value={formatDate(b.shootDate)} />
            <Field label="Call time" value={b.callTime ?? '–'} />
            <Field
              label="Location"
              value={
                b.contract?.status === 'fully_signed'
                  ? b.shootLocation
                  : 'Reveals when contract is fully signed'
              }
              className="col-span-2"
            />
            <Field label="Payment type" value={b.paymentType} />
            <Field label="Agreed rate" value={formatCurrency(b.agreedRate)} />
            {b.agreedHours ? <Field label="Agreed hours" value={`${b.agreedHours}h`} /> : null}
            <Field label="Total" value={formatCurrency(b.totalAmount)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Booking</span>
              <StatusBadge status={b.status} />
            </div>
            <Separator />
            {b.contract ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contract</span>
                <StatusBadge status={b.contract.status} />
              </div>
            ) : null}
            {b.payment ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Escrow</span>
                <StatusBadge status={b.payment.escrowStatus} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="capitalize">{value}</div>
    </div>
  )
}
