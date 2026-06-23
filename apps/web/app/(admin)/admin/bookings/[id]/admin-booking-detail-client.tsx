'use client'

import Link from 'next/link'
import { ChevronLeft, CalendarDays, Clock, PoundSterling, Scale, Ban } from 'lucide-react'
import { ApiError } from '@/lib/fetcher'
import {
  PageHeader,
  LoadingState,
  ErrorState,
  StatusBadge,
  Money,
} from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAdminBooking } from '@/lib/hooks/use-admin'
import { useDispute } from '@/lib/hooks/use-disputes'
import { formatDate } from '@/lib/utils'

export function AdminBookingDetailClient({ bookingId }: { bookingId: string }) {
  const { data: booking, isPending, isError, error, refetch } = useAdminBooking(bookingId)
  // A dispute is keyed by bookingId. retry:false in the hook means a 404 is harmless.
  const disputeQuery = useDispute(bookingId)
  const dispute = disputeQuery.data ?? null

  if (isPending) return <LoadingState variant="detail" />

  if (isError) {
    const status = error instanceof ApiError ? error.status : 0
    if (status === 404 || status === 410) {
      return (
        <div className="space-y-4">
          <BackLink />
          <ErrorState
            title="Booking not found"
            message="This booking may have been cancelled or removed."
          />
        </div>
      )
    }
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorState onRetry={() => void refetch()} />
      </div>
    )
  }

  const contract = booking.contract ?? null
  const hasDispute = booking.status === 'disputed' || Boolean(dispute)
  const isHourly = booking.paymentType === 'hourly'

  return (
    <div className="space-y-6">
      <BackLink />

      <PageHeader
        title={`Booking ${booking.id.slice(0, 8)}`}
        description={`Created ${formatDate(booking.createdAt)}`}
        actions={<StatusBadge status={booking.status} />}
      />

      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <Scale className="mt-0.5 h-4 w-4 shrink-0" />
        This is a read-only view. Job fees are settled directly between caster and artist,
        off-platform. Act on disputes from the dispute page.
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-4 p-6">
            <h2 className="text-sm font-semibold text-foreground">Booking details</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail
                icon={CalendarDays}
                label="Shoot date"
                value={formatDate(booking.shootDate)}
              />
              <Detail icon={Clock} label="Payment type" value={isHourly ? 'Hourly' : 'Fixed'} />
              <Detail
                icon={PoundSterling}
                label="Agreed rate"
                value={`${formatMoney(booking.agreedRate)}${isHourly ? '/hr' : ''}`}
              />
              {isHourly ? (
                <Detail
                  icon={Clock}
                  label="Agreed hours"
                  value={`${booking.agreedHours ?? '—'} hrs`}
                />
              ) : null}
              <Detail
                icon={PoundSterling}
                label="Total amount"
                value={formatMoney(booking.totalAmount)}
              />
              <Detail
                icon={CalendarDays}
                label="Completion confirmed"
                value={
                  booking.completionConfirmedAt
                    ? formatDate(booking.completionConfirmedAt)
                    : 'Not yet'
                }
              />
              <Detail label="Caster" value={booking.caster?.companyName ?? booking.casterId} />
              <Detail
                label="Artist"
                value={
                  booking.artist
                    ? `${booking.artist.firstName} ${booking.artist.lastName}`
                    : booking.artistId
                }
              />
            </dl>
          </Card>

          {booking.cancelledAt || booking.cancellationReason || booking.cancelledBy ? (
            <Card className="space-y-4 p-6">
              <div className="flex items-center gap-2">
                <Ban className="h-4 w-4 text-destructive" />
                <h2 className="text-sm font-semibold text-foreground">Cancellation</h2>
              </div>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail
                  label="Cancelled by"
                  value={booking.cancelledBy ? titleCase(booking.cancelledBy) : '—'}
                />
                <Detail label="Cancelled at" value={formatDate(booking.cancelledAt)} />
                {booking.cancellationReason ? (
                  <div className="sm:col-span-2">
                    <Detail label="Reason" value={booking.cancellationReason} />
                  </div>
                ) : null}
              </dl>
            </Card>
          ) : null}

          <Card className="space-y-3 p-6">
            <h2 className="text-sm font-semibold text-foreground">Payment</h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Agreed total</span>
              <span className="font-medium text-foreground">
                <Money amount={booking.totalAmount} />
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Settled directly between caster and artist, off-platform. CastFlow does not process job
              payments.
            </p>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-3 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Contract</h2>
              {contract ? <StatusBadge status={contract.status} /> : null}
            </div>
            {contract ? (
              <ul className="space-y-2 text-sm">
                <Row label="Artist signed" value={contract.artistSigned ? 'Yes' : 'No'} />
                <Row label="Caster signed" value={contract.casterSigned ? 'Yes' : 'No'} />
                <Row label="Terms" value={contract.paymentTerms} />
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No contract generated yet.</p>
            )}
          </Card>

          {hasDispute ? (
            <Card className="space-y-3 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Dispute</h2>
                {dispute ? <StatusBadge status={dispute.status} /> : null}
              </div>
              <p className="text-sm text-muted-foreground">
                A dispute is open on this booking. Review and resolve it from the dispute page.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/admin/disputes/${bookingId}`}>
                  <Scale className="mr-1.5 h-4 w-4" /> Open dispute
                </Link>
              </Button>
            </Card>
          ) : null}

          <Card className="space-y-3 p-6">
            <h2 className="text-sm font-semibold text-foreground">Summary</h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium text-foreground">
                <Money amount={booking.totalAmount} />
              </span>
            </div>
            <Separator />
            <p className="font-mono text-[11px] text-muted-foreground">{booking.id}</p>
          </Card>
        </div>
      </div>
    </div>
  )
}

function formatMoney(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)
}

function BackLink() {
  return (
    <Link
      href="/admin/bookings"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" /> Back to bookings
    </Link>
  )
}

function Detail({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon?: typeof CalendarDays
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null} {label}
      </div>
      <p
        className={
          mono ? 'mt-1 break-all font-mono text-xs text-foreground' : 'mt-1 text-sm text-foreground'
        }
      >
        {value}
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </li>
  )
}

function titleCase(s: string): string {
  return s.replace(/(^|_)([a-z])/g, (_, _sep: string, c: string) => ` ${c.toUpperCase()}`).trim()
}
