'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ChevronLeft, Scale, ShieldCheck } from 'lucide-react'
import type { DisputeReason, DisputeResolution } from '@castflow/types'
import { ApiError } from '@/lib/fetcher'
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
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDispute, useResolveDispute } from '@/lib/hooks/use-disputes'
import { useAdminBooking } from '@/lib/hooks/use-admin'
import { formatDate } from '@/lib/utils'

const REASON_LABEL: Record<DisputeReason, string> = {
  no_show_artist: 'Artist did not show up',
  no_show_caster: 'Caster did not show up',
  payment_issue: 'Payment issue',
  quality_issue: 'Quality issue',
  other: 'Other',
}

const RESOLUTION_OPTIONS: { value: DisputeResolution; label: string }[] = [
  { value: 'full_release_to_artist', label: 'Full release to artist' },
  { value: 'full_refund_to_caster', label: 'Full refund to caster' },
  { value: 'split', label: 'Split between both parties' },
  { value: 'escalated', label: 'Escalate for legal review' },
]

export function AdminDisputeDetailClient({ bookingId }: { bookingId: string }) {
  const { data: dispute, isPending, isError, error, refetch } = useDispute(bookingId)
  const bookingQuery = useAdminBooking(bookingId)
  const booking = bookingQuery.data

  if (isPending) return <LoadingState variant="detail" />

  if (isError) {
    const status = error instanceof ApiError ? error.status : 0
    if (status === 404 || status === 410) {
      return (
        <div className="space-y-4">
          <BackLink />
          <EmptyState
            title="No dispute for this booking"
            description="There’s no open or resolved dispute associated with this booking."
            icon={<Scale className="h-6 w-6" />}
            action={
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/bookings/${bookingId}`}>Back to booking</Link>
              </Button>
            }
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

  const resolved = dispute.status === 'resolved' || dispute.status === 'escalated'
  const canResolve = dispute.status === 'open' || dispute.status === 'under_review'

  return (
    <div className="space-y-6">
      <BackLink />

      <PageHeader
        title="Dispute"
        description={`Booking ${bookingId.slice(0, 8)} · opened ${formatDate(dispute.createdAt)}`}
        actions={<StatusBadge status={dispute.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-4 p-6">
            <h2 className="text-sm font-semibold text-foreground">Dispute</h2>
            <dl className="space-y-3">
              <Field label="Reason" value={REASON_LABEL[dispute.reason]} />
              <Field label="Description" value={dispute.description} />
              <Field label="Raised by" value={dispute.raisedById} mono />
              <Field label="Raised against" value={dispute.raisedAgainstId} mono />
            </dl>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <SubmissionCard
              title="Artist’s statement"
              submission={dispute.artistSubmission}
              submittedAt={dispute.artistSubmittedAt}
            />
            <SubmissionCard
              title="Caster’s statement"
              submission={dispute.casterSubmission}
              submittedAt={dispute.casterSubmittedAt}
            />
          </div>

          {resolved ? (
            <Card className="space-y-3 p-6">
              <h2 className="text-sm font-semibold text-foreground">Outcome</h2>
              <Field label="Resolution" value={resolutionLabel(dispute.resolution)} />
              {dispute.splitArtistPct !== null && dispute.splitArtistPct !== undefined ? (
                <Field
                  label="Split"
                  value={`Artist ${dispute.splitArtistPct}% · Caster ${100 - dispute.splitArtistPct}%`}
                />
              ) : null}
              {dispute.adminNotes ? <Field label="Admin notes" value={dispute.adminNotes} /> : null}
              {dispute.resolvedAt ? (
                <p className="text-xs text-muted-foreground">
                  Resolved {formatDate(dispute.resolvedAt)}.
                </p>
              ) : null}
            </Card>
          ) : null}

          {canResolve ? <ResolvePanel bookingId={bookingId} /> : null}
        </div>

        <div className="space-y-4">
          <Card className="space-y-3 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Booking</h2>
              {booking ? <StatusBadge status={booking.status} /> : null}
            </div>
            {bookingQuery.isPending ? (
              <p className="text-sm text-muted-foreground">Loading booking…</p>
            ) : booking ? (
              <ul className="space-y-2 text-sm">
                <Row label="Shoot date" value={formatDate(booking.shootDate)} />
                <Row label="Payment type" value={booking.paymentType === 'hourly' ? 'Hourly' : 'Fixed'} />
                <Row
                  label="Total"
                  value={<Money amount={booking.totalAmount} />}
                />
                {booking.payment ? (
                  <Row label="Escrow" value={<StatusBadge status={booking.payment.escrowStatus} />} />
                ) : null}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Booking details unavailable.</p>
            )}
            <Separator />
            <Button asChild variant="outline" className="w-full">
              <Link href={`/admin/bookings/${bookingId}`}>View booking</Link>
            </Button>
          </Card>

          <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            Every resolution is permanently logged.
          </div>
        </div>
      </div>
    </div>
  )
}

function ResolvePanel({ bookingId }: { bookingId: string }) {
  const resolve = useResolveDispute(bookingId)
  const [resolution, setResolution] = useState<DisputeResolution | ''>('')
  const [splitPct, setSplitPct] = useState<string>('50')
  const [notes, setNotes] = useState('')

  const isSplit = resolution === 'split'
  const splitValue = Number(splitPct)
  const splitValid = !isSplit || (Number.isFinite(splitValue) && splitValue >= 0 && splitValue <= 100)
  const notesValid = notes.trim().length >= 10
  const canSubmit = Boolean(resolution) && notesValid && splitValid && !resolve.isPending

  function submit() {
    if (!resolution || !notesValid || !splitValid) return
    resolve.mutate({
      resolution,
      adminNotes: notes.trim(),
      ...(isSplit ? { splitArtistPct: splitValue } : {}),
    })
  }

  return (
    <Card className="space-y-4 p-6">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Resolve dispute</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose an outcome. This is final and permanently logged.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="resolution">Resolution</Label>
        <Select
          value={resolution}
          onValueChange={(v) => setResolution(v as DisputeResolution)}
        >
          <SelectTrigger id="resolution" className="w-full">
            <SelectValue placeholder="Select an outcome" />
          </SelectTrigger>
          <SelectContent>
            {RESOLUTION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isSplit ? (
        <div className="space-y-1.5">
          <Label htmlFor="split-pct">Artist share (%)</Label>
          <Input
            id="split-pct"
            type="number"
            min={0}
            max={100}
            value={splitPct}
            onChange={(e) => setSplitPct(e.target.value)}
            className="w-32"
          />
          <p className="text-xs text-muted-foreground">
            {splitValid
              ? `Artist gets ${splitValue}%, caster gets ${100 - splitValue}%.`
              : 'Enter a value between 0 and 100.'}
          </p>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="admin-notes">Admin notes (required)</Label>
        <Textarea
          id="admin-notes"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Explain the basis for this resolution (at least 10 characters)."
          maxLength={2000}
        />
        {!notesValid && notes.length > 0 ? (
          <p className="text-xs text-destructive">Please give at least 10 characters.</p>
        ) : null}
      </div>

      <Button disabled={!canSubmit} onClick={submit}>
        {resolve.isPending ? 'Resolving…' : 'Resolve dispute'}
      </Button>
    </Card>
  )
}

function SubmissionCard({
  title,
  submission,
  submittedAt,
}: {
  title: string
  submission: string | null
  submittedAt: string | null
}) {
  return (
    <Card className="space-y-2 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {submittedAt ? (
          <span className="text-xs text-muted-foreground">{formatDate(submittedAt)}</span>
        ) : null}
      </div>
      {submission ? (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{submission}</p>
      ) : (
        <p className="text-sm italic text-muted-foreground">No statement submitted yet.</p>
      )}
    </Card>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd
        className={
          mono
            ? 'mt-0.5 break-all font-mono text-xs text-foreground'
            : 'mt-0.5 whitespace-pre-wrap text-sm text-foreground'
        }
      >
        {value}
      </dd>
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

function resolutionLabel(resolution: string | null): string {
  switch (resolution) {
    case 'full_release_to_artist':
      return 'Full release to artist'
    case 'full_refund_to_caster':
      return 'Full refund to caster'
    case 'split':
      return 'Split between both parties'
    case 'escalated':
      return 'Escalated for legal review'
    default:
      return 'Pending'
  }
}

function BackLink() {
  return (
    <Link
      href="/admin/disputes"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" /> Back to disputes
    </Link>
  )
}
