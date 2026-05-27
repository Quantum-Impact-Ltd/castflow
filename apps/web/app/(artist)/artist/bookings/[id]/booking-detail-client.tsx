'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  CalendarDays,
  Clock,
  Building2,
  MapPin,
  FileText,
  AlertTriangle,
  Star,
  Ban,
} from 'lucide-react'
import { ApiError } from '@/lib/fetcher'
import {
  PageHeader,
  LoadingState,
  ErrorState,
  LockedField,
  StatusBadge,
  CommissionBreakdown,
  Money,
} from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useBooking, useCancelBooking } from '@/lib/hooks/use-bookings'
import { formatDate } from '@/lib/utils'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

export function BookingDetailClient({ bookingId }: { bookingId: string }) {
  const { data: booking, isPending, isError, error, refetch } = useBooking(bookingId)
  const cancel = useCancelBooking(bookingId)

  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState('')

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
    return <ErrorState onRetry={() => void refetch()} />
  }

  const contract = booking.contract ?? null
  const payment = booking.payment ?? null
  const locationUnlocked = contract?.status === 'fully_signed'

  const shootTime = new Date(booking.shootDate).getTime()
  const now = Date.now()
  const msUntilShoot = shootTime - now
  const msSinceShoot = now - shootTime

  // Contract action: shown until the contract is fully signed/voided.
  const showContractAction =
    !contract ||
    contract.status === 'pending_signatures' ||
    contract.status === 'partially_signed'

  // Cancellation allowed while the booking is still live.
  const canCancel = booking.status === 'pending_payment' || booking.status === 'confirmed'

  // Dispute window: within 72h after the shoot date.
  const canDispute =
    booking.status !== 'cancelled' && msSinceShoot >= 0 && msSinceShoot <= 72 * HOUR_MS

  // Review window: completed and 14–28 days after the shoot date.
  const reviewOpensAt = shootTime + 14 * DAY_MS
  const reviewClosesAt = shootTime + 28 * DAY_MS
  const canReview =
    booking.status === 'completed' && now >= reviewOpensAt && now <= reviewClosesAt

  const isHourly = booking.paymentType === 'hourly'
  const rateLabel = isHourly
    ? `${booking.agreedHours ?? '—'} hrs at hourly rate`
    : 'Flat rate'

  function submitCancellation() {
    const trimmed = reason.trim()
    if (trimmed.length < 10) return
    cancel.mutate(trimmed, {
      onSuccess: () => {
        setCancelOpen(false)
        setReason('')
      },
    })
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <PageHeader
        title={booking.job?.title ?? 'Booking'}
        description={booking.caster?.companyName ?? 'CastFlow caster'}
        actions={<StatusBadge status={booking.status} />}
      />

      {booking.status === 'disputed' ? (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Escrow is frozen while a dispute is open. Funds won’t move until an admin resolves it.
        </div>
      ) : null}

      {!locationUnlocked ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          The shoot location and call time are revealed once both parties have signed the contract.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-4 p-6">
            <h2 className="text-sm font-semibold text-foreground">Shoot details</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail
                icon={CalendarDays}
                label="Shoot date"
                value={formatDate(booking.shootDate)}
              />
              <Detail
                icon={Clock}
                label="Duration"
                value={isHourly ? `${booking.agreedHours ?? '—'} hrs` : 'Full shoot'}
              />
              <Detail
                icon={Building2}
                label="Booked by"
                value={booking.caster?.companyName ?? 'CastFlow caster'}
              />
              <div>
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> Location
                </div>
                <div className="mt-1">
                  {locationUnlocked ? (
                    <p className="text-sm text-foreground">{booking.shootLocation || '—'}</p>
                  ) : (
                    <LockedField reason="Revealed once both parties sign the contract" />
                  )}
                </div>
              </div>
              {locationUnlocked && booking.callTime ? (
                <Detail icon={Clock} label="Call time" value={formatDate(booking.callTime)} />
              ) : null}
            </dl>
          </Card>

          {payment ? (
            <Card className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Payment</h2>
                <StatusBadge status={payment.escrowStatus} />
              </div>
              <CommissionBreakdown
                gross={payment.grossAmount}
                commissionRate={payment.platformCommissionRate}
                commissionAmount={payment.platformCommissionAmount}
                net={payment.netArtistAmount}
              />
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card className="space-y-4 p-6">
            <p className="text-2xl font-semibold text-foreground">
              <Money amount={booking.agreedRate} />
              {isHourly ? '/hr' : ''}
            </p>
            <p className="text-sm text-muted-foreground">{rateLabel}</p>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium text-foreground">
                <Money amount={booking.totalAmount} />
              </span>
            </div>
            {payment ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your net payout</span>
                <span className="font-medium text-foreground">
                  <Money amount={payment.netArtistAmount} />
                </span>
              </div>
            ) : null}
          </Card>

          <Card className="space-y-3 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Contract</h2>
              {contract ? <StatusBadge status={contract.status} /> : null}
            </div>
            {showContractAction ? (
              <Button asChild className="w-full">
                <Link href={`/artist/bookings/${booking.id}/contract`}>
                  <FileText className="mr-1.5 h-4 w-4" />
                  {contract ? 'View / sign contract' : 'View contract'}
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/artist/bookings/${booking.id}/contract`}>View contract</Link>
              </Button>
            )}
          </Card>

          <Card className="space-y-3 p-6">
            <h2 className="text-sm font-semibold text-foreground">Actions</h2>
            {canReview ? (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/artist/bookings/${booking.id}/review`}>
                  <Star className="mr-1.5 h-4 w-4" /> Leave a review
                </Link>
              </Button>
            ) : null}

            {canDispute ? (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/artist/bookings/${booking.id}/dispute`}>
                  <AlertTriangle className="mr-1.5 h-4 w-4" /> Raise a dispute
                </Link>
              </Button>
            ) : null}

            {canCancel ? (
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive"
                onClick={() => setCancelOpen(true)}
              >
                <Ban className="mr-1.5 h-4 w-4" /> Cancel booking
              </Button>
            ) : null}

            {!canReview && !canDispute && !canCancel ? (
              <p className="text-sm text-muted-foreground">
                No actions are available for this booking right now.
              </p>
            ) : null}
          </Card>
        </div>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this booking?</DialogTitle>
            <DialogDescription>
              Cancellation penalties depend on how much notice you give before the shoot.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
            <PolicyRow
              label="More than 7 days’ notice"
              value="Full refund to the caster. No penalty for you."
              active={msUntilShoot > 7 * DAY_MS}
            />
            <PolicyRow
              label="3–7 days’ notice"
              value="Full refund to the caster, plus a formal warning on your account."
              active={msUntilShoot <= 7 * DAY_MS && msUntilShoot > 3 * DAY_MS}
            />
            <PolicyRow
              label="Less than 48 hours’ notice"
              value="You receive 50% of the agreed rate, the rest is refunded, and a strike is added to your account."
              active={msUntilShoot <= 48 * HOUR_MS}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Reason for cancelling</Label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Let the caster know why you’re cancelling (at least 10 characters)…"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">{reason.trim().length}/10 characters minimum</p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={cancel.isPending}>
              Keep booking
            </Button>
            <Button
              variant="destructive"
              onClick={submitCancellation}
              disabled={reason.trim().length < 10 || cancel.isPending}
            >
              {cancel.isPending ? 'Cancelling…' : 'Cancel booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PolicyRow({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div className={active ? 'rounded-md bg-background p-2 ring-1 ring-primary/40' : ''}>
      <p className="font-medium text-foreground">
        {label}
        {active ? <span className="ml-2 text-xs text-primary">(applies to you)</span> : null}
      </p>
      <p className="text-muted-foreground">{value}</p>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/artist/bookings"
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
}: {
  icon: typeof CalendarDays
  label: string
  value: string
}) {
  return (
    <div>
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  )
}
