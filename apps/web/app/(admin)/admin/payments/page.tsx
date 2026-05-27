'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PoundSterling, ArrowUpRight } from 'lucide-react'
import type { AdminPaymentRow } from '@/lib/api/admin'
import {
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
  Money,
} from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

const ESCROW_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'held', label: 'In escrow' },
  { value: 'released', label: 'Released' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'partially_refunded', label: 'Partially refunded' },
  { value: 'disputed', label: 'Disputed' },
  { value: 'awaiting_payment', label: 'Awaiting payment' },
]

export default function AdminPaymentsPage() {
  const [escrowStatus, setEscrowStatus] = useState<string>('all')

  const filters = escrowStatus === 'all' ? {} : { escrowStatus }
  const { data, isPending, isError, refetch } = useAdminPayments(filters)
  const payments = data ?? []

  const totalCommission = useMemo(
    () => payments.reduce((sum, p) => sum + Number(p.platformCommissionAmount ?? 0), 0),
    [payments]
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Escrow ledger across the platform. Force-release and refund are exceptional actions."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {!isPending && !isError && payments.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Platform commission across {payments.length} payment
            {payments.length === 1 ? '' : 's'}:{' '}
            <span className="font-medium text-foreground">
              <Money amount={totalCommission} />
            </span>
          </p>
        ) : (
          <span />
        )}
        <Select value={escrowStatus} onValueChange={setEscrowStatus}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Filter by escrow status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ESCROW_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending ? (
        <LoadingState rows={6} />
      ) : isError ? (
        <ErrorState message="We couldn’t load payments." onRetry={() => void refetch()} />
      ) : payments.length === 0 ? (
        <EmptyState
          title="No payments found"
          description="No payments match the selected escrow status."
          icon={<PoundSterling className="h-6 w-6" />}
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Net</TableHead>
                <TableHead>Escrow</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((row) => (
                <PaymentRow key={row.id} row={row} />
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}

function PaymentRow({ row }: { row: AdminPaymentRow }) {
  const bookingId = row.bookingId
  const releasable = row.escrowStatus === 'held' || row.escrowStatus === 'disputed'
  const refundable =
    row.escrowStatus === 'held' ||
    row.escrowStatus === 'disputed' ||
    row.escrowStatus === 'awaiting_payment'

  return (
    <TableRow>
      <TableCell>
        {row.booking?.id ? (
          <Link
            href={`/admin/bookings/${row.booking.id}`}
            className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
          >
            {row.booking.id.slice(0, 8)}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">{bookingId.slice(0, 8)}</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Money amount={row.grossAmount} />
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        <Money amount={row.platformCommissionAmount} />
      </TableCell>
      <TableCell className="text-right">
        <Money amount={row.netArtistAmount} />
      </TableCell>
      <TableCell>
        <StatusBadge status={row.escrowStatus} />
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/admin/payments/${row.id}`}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Details
          </Link>
          <EscrowActionDialog mode="release" bookingId={bookingId} disabled={!releasable} />
          <EscrowActionDialog mode="refund" bookingId={bookingId} disabled={!refundable} />
        </div>
      </TableCell>
    </TableRow>
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

  const label = mode === 'release' ? 'Force-release' : 'Refund'
  const title = mode === 'release' ? 'Force-release escrow?' : 'Refund escrow?'
  const description =
    mode === 'release'
      ? 'This releases held funds to the artist immediately, bypassing the normal flow. Exceptional use only — permanently logged.'
      : 'This refunds held funds to the caster immediately. Exceptional use only — permanently logged.'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant={mode === 'release' ? 'outline' : 'ghost'}
        size="sm"
        className={
          mode === 'refund' ? 'text-destructive hover:text-destructive' : undefined
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
          <Label htmlFor={`${mode}-notes-${bookingId}`}>Reason / notes (required)</Label>
          <Textarea
            id={`${mode}-notes-${bookingId}`}
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
            {mutation.isPending ? 'Working…' : label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
