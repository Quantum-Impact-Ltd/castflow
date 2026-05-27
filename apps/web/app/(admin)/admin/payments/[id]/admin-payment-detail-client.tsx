'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ChevronLeft, AlertTriangle, ArrowUpRight } from 'lucide-react'
import {
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
  CommissionBreakdown,
  Money,
} from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAdminPayments, useForceRelease, useForceRefund } from '@/lib/hooks/use-admin'
import { formatDate } from '@/lib/utils'

export function AdminPaymentDetailClient({ paymentId }: { paymentId: string }) {
  const { data, isPending, isError, refetch } = useAdminPayments()
  const payment = (data ?? []).find((p) => p.id === paymentId)

  if (isPending) return <LoadingState variant="detail" />

  if (isError) {
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorState message="We couldn’t load payments." onRetry={() => void refetch()} />
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="space-y-4">
        <BackLink />
        <EmptyState
          title="Payment not found"
          description="This payment isn’t in the current list. It may have a different escrow status — try the payments console."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/payments">Back to payments</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const releasable = payment.escrowStatus === 'held' || payment.escrowStatus === 'disputed'
  const refundable =
    payment.escrowStatus === 'held' ||
    payment.escrowStatus === 'disputed' ||
    payment.escrowStatus === 'awaiting_payment'

  return (
    <div className="space-y-6">
      <BackLink />

      <PageHeader
        title={`Payment ${payment.id.slice(0, 8)}`}
        description={`Created ${formatDate(payment.createdAt)}`}
        actions={<StatusBadge status={payment.escrowStatus} />}
      />

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        Force-release and refund bypass the normal escrow flow. Exceptional use only — every action
        is permanently logged.
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-4 p-6">
            <h2 className="text-sm font-semibold text-foreground">Breakdown</h2>
            <CommissionBreakdown
              gross={payment.grossAmount}
              commissionRate={payment.platformCommissionRate}
              commissionAmount={payment.platformCommissionAmount}
              net={payment.netArtistAmount}
            />
            {payment.cancellationFeeAmount != null ? (
              <>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cancellation fee</span>
                  <span className="font-medium text-foreground">
                    <Money amount={payment.cancellationFeeAmount} />
                  </span>
                </div>
              </>
            ) : null}
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="text-sm font-semibold text-foreground">Escrow timeline</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Escrow status" value={statusLabel(payment.escrowStatus)} />
              <Detail label="Auto-release at" value={formatDate(payment.autoReleaseAt)} />
              <Detail label="Paid at" value={formatDate(payment.paidAt)} />
              <Detail label="Released at" value={formatDate(payment.releasedAt)} />
              <Detail label="Refunded at" value={formatDate(payment.refundedAt)} />
            </dl>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="space-y-3 p-6">
            <h2 className="text-sm font-semibold text-foreground">Linked booking</h2>
            {payment.booking ? (
              <ul className="space-y-2 text-sm">
                <Row label="Status" value={<StatusBadge status={payment.booking.status} />} />
                <Row label="Shoot date" value={formatDate(payment.booking.shootDate)} />
                <li>
                  <Link
                    href={`/admin/bookings/${payment.booking.id}`}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    View booking <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Booking {payment.bookingId.slice(0, 8)}.
              </p>
            )}
          </Card>

          <Card className="space-y-3 p-6">
            <h2 className="text-sm font-semibold text-foreground">Actions</h2>
            <p className="text-xs text-muted-foreground">Exceptional use only.</p>
            <EscrowActionDialog mode="release" bookingId={payment.bookingId} disabled={!releasable} />
            <EscrowActionDialog mode="refund" bookingId={payment.bookingId} disabled={!refundable} />
            {!releasable && !refundable ? (
              <p className="text-sm text-muted-foreground">
                No manual escrow actions are available in the current state.
              </p>
            ) : null}
          </Card>

          <Card className="space-y-2 p-6">
            <h2 className="text-sm font-semibold text-foreground">Reference</h2>
            <p className="font-mono text-[11px] break-all text-muted-foreground">{payment.id}</p>
          </Card>
        </div>
      </div>
    </div>
  )
}

function EscrowActionDialog({
  mode,
  bookingId,
  disabled,
}: {
  mode: 'release' | 'refund'
  bookingId: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const release = useForceRelease()
  const refund = useForceRefund()
  const mutation = mode === 'release' ? release : refund
  const valid = notes.trim().length >= 3

  const label = mode === 'release' ? 'Force-release escrow' : 'Refund escrow'
  const title = mode === 'release' ? 'Force-release escrow?' : 'Refund escrow?'
  const description =
    mode === 'release'
      ? 'This releases held funds to the artist immediately, bypassing the normal flow. Exceptional use only — permanently logged.'
      : 'This refunds held funds to the caster immediately. Exceptional use only — permanently logged.'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant={mode === 'refund' ? 'outline' : 'default'}
        className={
          mode === 'refund'
            ? 'w-full text-destructive hover:text-destructive'
            : 'w-full'
        }
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor={`${mode}-notes`}>Reason / notes (required)</Label>
          <Textarea
            id={`${mode}-notes`}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Why is this action being taken? (at least 3 characters)"
            maxLength={1000}
          />
          {!valid && notes.length > 0 ? (
            <p className="text-xs text-destructive">Please give at least 3 characters.</p>
          ) : null}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant={mode === 'refund' ? 'destructive' : 'default'}
            disabled={!valid || mutation.isPending}
            onClick={() =>
              mutation.mutate(
                { bookingId, notes: notes.trim() },
                {
                  onSuccess: () => {
                    setOpen(false)
                    setNotes('')
                  },
                }
              )
            }
          >
            {mutation.isPending ? 'Working…' : mode === 'release' ? 'Release' : 'Refund'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BackLink() {
  return (
    <Link
      href="/admin/payments"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" /> Back to payments
    </Link>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </li>
  )
}

function statusLabel(status: string): string {
  return status
    .split('_')
    .map((w) => (w.length ? `${w[0]!.toUpperCase()}${w.slice(1)}` : w))
    .join(' ')
}
