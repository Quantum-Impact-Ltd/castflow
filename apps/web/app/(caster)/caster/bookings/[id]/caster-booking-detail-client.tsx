'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  CalendarDays,
  Clock,
  User,
  MapPin,
  FileText,
  AlertTriangle,
  Star,
  Ban,
  CheckCircle2,
} from 'lucide-react'
import { ApiError } from '@/lib/fetcher'
import {
  PageHeader,
  LoadingState,
  ErrorState,
  LockedField,
  StatusBadge,
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
import {
  useBooking,
  useCancelBooking,
  useConfirmCompletion,
} from '@/lib/hooks/use-bookings'
import { formatDate } from '@/lib/utils'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

export function CasterBookingDetailClient({ bookingId }: { bookingId: string }) {
  const { data: booking, isPending, isError, error, refetch } = useBooking(bookingId)
  const cancel = useCancelBooking(bookingId)
  const confirmCompletion = useConfirmCompletion(bookingId)

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
  const locationUnlocked = contract?.status === 'fully_signed'

  const shootTime = new Date(booking.shootDate).getTime()
  const now = Date.now()
  const msUntilShoot = shootTime - now
  const msSinceShoot = now - shootTime
  const shootHasPassed = msSinceShoot >= 0

  const isHourly = booking.paymentType === 'hourly'
  const rateLabel = isHourly ? `${booking.agreedHours ?? '—'} hrs at hourly rate` : 'Flat rate'

  // Artist contact reveal mirrors the contract gate.
  const artistName = booking.artist
    ? locationUnlocked
      ? `${booking.artist.firstName} ${booking.artist.lastName}`
      : booking.artist.firstName
    : 'Artist'

  // Contract action: shown until the contract is fully signed/voided.
  const showContractAction =
    !contract ||
    contract.status === 'pending_signatures' ||
    contract.status === 'partially_signed'

  // Completion confirm: only once the booking is confirmed (contract signed).
  const canShowConfirm = booking.status === 'confirmed'
  const confirmUnlocked = shootHasPassed

  // Cancellation allowed while the booking is still live.
  const canCancel = booking.status === 'pending_contract' || booking.status === 'confirmed'

  // Dispute window: within 72h after the shoot date.
  const canDispute =
    booking.status !== 'cancelled' && shootHasPassed && msSinceShoot <= 72 * HOUR_MS

  // Review window: completed and 14–28 days after the shoot date.
  const reviewOpensAt = shootTime + 14 * DAY_MS
  const reviewClosesAt = shootTime + 28 * DAY_MS
  const canReview =
    booking.status === 'completed' && now >= reviewOpensAt && now <= reviewClosesAt

  const noActions = !canShowConfirm && !canReview && !canDispute && !canCancel

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
        description={artistName}
        actions={<StatusBadge status={booking.status} />}
      />

      {booking.status === 'disputed' ? (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          A dispute is open on this booking. An admin will review it and follow up with both parties.
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
              <div>
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  <User className="h-3.5 w-3.5" /> Artist
                </div>
                <div className="mt-1">
                  {locationUnlocked ? (
                    <p className="text-sm text-foreground">{artistName}</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm text-foreground">{artistName}</p>
                      <p className="text-xs text-muted-foreground">
                        Full name revealed once the contract is fully signed.
                      </p>
                    </div>
                  )}
                </div>
              </div>
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

          <Card className="space-y-3 p-6">
            <h2 className="text-sm font-semibold text-foreground">Payment</h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Agreed total</span>
              <span className="text-lg font-semibold text-foreground">
                <Money amount={booking.totalAmount} />
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Paid directly to the artist, off-platform. CastFlow does not process job payments.
            </p>
          </Card>
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
              <span className="text-muted-foreground">Agreed total</span>
              <span className="font-medium text-foreground">
                <Money amount={booking.totalAmount} />
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Paid directly to the artist, off-platform.
            </p>
          </Card>

          <Card className="space-y-3 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Contract</h2>
              {contract ? <StatusBadge status={contract.status} /> : null}
            </div>
            {showContractAction ? (
              <Button asChild className="w-full">
                <Link href={`/caster/bookings/${booking.id}/contract`}>
                  <FileText className="mr-1.5 h-4 w-4" />
                  {contract ? 'View / sign contract' : 'View contract'}
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/caster/bookings/${booking.id}/contract`}>View contract</Link>
              </Button>
            )}
          </Card>

          <Card className="space-y-3 p-6">
            <h2 className="text-sm font-semibold text-foreground">Actions</h2>

            {canShowConfirm ? (
              <div
                className="w-full"
                title={confirmUnlocked ? undefined : 'Available after the shoot date.'}
              >
                <Button
                  className="w-full"
                  disabled={!confirmUnlocked || confirmCompletion.isPending}
                  onClick={() => confirmCompletion.mutate()}
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  {confirmCompletion.isPending ? 'Confirming…' : 'Confirm shoot completion'}
                </Button>
                {!confirmUnlocked ? (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Available after the shoot date.
                  </p>
                ) : null}
              </div>
            ) : null}

            {canReview ? (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/caster/bookings/${booking.id}/review`}>
                  <Star className="mr-1.5 h-4 w-4" /> Leave a review
                </Link>
              </Button>
            ) : null}

            {canDispute ? (
              <Button asChild variant="outline" className="w-full">
                <Link href={`/caster/bookings/${booking.id}/dispute`}>
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

            {noActions ? (
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
              Cancellation terms depend on how much notice you give before the shoot.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
            <PolicyRow
              label="48 hours or more before the shoot"
              value="No cancellation fee. As payment is settled directly with the artist, nothing is owed."
              active={msUntilShoot >= 48 * HOUR_MS}
            />
            <PolicyRow
              label="Less than 48 hours before the shoot"
              value="A cancellation fee of 50% of the agreed rate is owed to the artist, payable directly off-platform."
              active={msUntilShoot < 48 * HOUR_MS}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Reason for cancelling</Label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Let the artist know why you’re cancelling (at least 10 characters)…"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {reason.trim().length}/10 characters minimum
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={cancel.isPending}
            >
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
        {active ? <span className="ml-2 text-xs text-primary">(applies now)</span> : null}
      </p>
      <p className="text-muted-foreground">{value}</p>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/caster/bookings"
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
