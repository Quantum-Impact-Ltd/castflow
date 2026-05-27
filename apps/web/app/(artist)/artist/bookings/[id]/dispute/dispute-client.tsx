'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, AlertTriangle, Lock } from 'lucide-react'
import type { DisputeReason } from '@castflow/types'
import { raiseDisputeSchema, type RaiseDisputeInput } from '@castflow/validators'
import { ApiError } from '@/lib/fetcher'
import { PageHeader, LoadingState, ErrorState, StatusBadge } from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBooking } from '@/lib/hooks/use-bookings'
import { useDispute, useRaiseDispute, useSubmitDisputeEvidence } from '@/lib/hooks/use-disputes'
import { formatDate } from '@/lib/utils'

const HOUR_MS = 60 * 60 * 1000

const DISPUTE_REASON_LABEL: Record<DisputeReason, string> = {
  no_show_artist: 'Artist did not show up',
  no_show_caster: 'Caster did not show up',
  payment_issue: 'Payment issue',
  quality_issue: 'Quality issue',
  other: 'Other',
}

export function DisputeClient({ bookingId }: { bookingId: string }) {
  const dispute = useDispute(bookingId)
  const booking = useBooking(bookingId)
  const raise = useRaiseDispute(bookingId)
  const submitEvidence = useSubmitDisputeEvidence(bookingId)

  const [evidence, setEvidence] = useState('')

  const form = useForm<RaiseDisputeInput>({
    resolver: zodResolver(raiseDisputeSchema),
    defaultValues: { reason: undefined, description: '' },
  })

  // Both queries use retry:false; a 404 on the dispute query just means none exists.
  if (dispute.isPending || booking.isPending) return <LoadingState variant="detail" />

  const disputeStatus = dispute.error instanceof ApiError ? dispute.error.status : 0
  const hasDispute = !dispute.isError && Boolean(dispute.data)

  if (dispute.isError && disputeStatus !== 404) {
    return (
      <div className="space-y-4">
        <BackLink bookingId={bookingId} />
        <ErrorState onRetry={() => void dispute.refetch()} />
      </div>
    )
  }

  if (booking.isError) {
    return (
      <div className="space-y-4">
        <BackLink bookingId={bookingId} />
        <ErrorState onRetry={() => void booking.refetch()} />
      </div>
    )
  }

  // ── Existing dispute view ──────────────────────────────────────────────
  if (hasDispute && dispute.data) {
    const d = dispute.data
    const canSubmitEvidence = d.status === 'open' || d.status === 'under_review'
    const resolved = d.status === 'resolved'

    return (
      <div className="space-y-6">
        <BackLink bookingId={bookingId} />
        <PageHeader
          title="Dispute"
          description={booking.data?.job?.title ?? 'Booking dispute'}
          actions={<StatusBadge status={d.status} />}
        />

        <Card className="space-y-4 p-6">
          <h2 className="text-sm font-semibold text-foreground">Details</h2>
          <dl className="space-y-3">
            <Field label="Reason" value={DISPUTE_REASON_LABEL[d.reason]} />
            <Field label="Description" value={d.description} />
          </dl>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <SubmissionCard
            title="Artist’s statement"
            submission={d.artistSubmission}
            submittedAt={d.artistSubmittedAt}
          />
          <SubmissionCard
            title="Caster’s statement"
            submission={d.casterSubmission}
            submittedAt={d.casterSubmittedAt}
          />
        </div>

        {resolved ? (
          <Card className="space-y-3 p-6">
            <h2 className="text-sm font-semibold text-foreground">Outcome</h2>
            <Field label="Resolution" value={resolutionLabel(d.resolution)} />
            {d.splitArtistPct !== null ? (
              <Field
                label="Split"
                value={`Artist ${d.splitArtistPct}% · Caster ${100 - d.splitArtistPct}%`}
              />
            ) : null}
            {d.adminNotes ? <Field label="Admin notes" value={d.adminNotes} /> : null}
            <p className="text-xs text-muted-foreground">
              Resolved {formatDate(d.resolvedAt)}.
            </p>
          </Card>
        ) : (
          <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            Escrow is frozen while this dispute is open. An admin will review both statements.
          </div>
        )}

        {canSubmitEvidence ? (
          <Card className="space-y-4 p-6">
            <h2 className="text-sm font-semibold text-foreground">
              {d.artistSubmission ? 'Add more evidence' : 'Submit your statement'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Describe your side of what happened so the admin has the full picture.
            </p>
            <div className="space-y-2">
              <Label htmlFor="evidence">Your statement</Label>
              <Textarea
                id="evidence"
                rows={6}
                maxLength={2000}
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="Provide a detailed account (at least 50 characters)…"
              />
              <p className="text-xs text-muted-foreground">
                {evidence.trim().length}/50 characters minimum
              </p>
            </div>
            <Button
              disabled={evidence.trim().length < 50 || submitEvidence.isPending}
              onClick={() =>
                submitEvidence.mutate(evidence.trim(), { onSuccess: () => setEvidence('') })
              }
            >
              {submitEvidence.isPending ? 'Submitting…' : 'Submit evidence'}
            </Button>
          </Card>
        ) : null}
      </div>
    )
  }

  // ── Raise dispute view ─────────────────────────────────────────────────
  const shootTime = new Date(booking.data.shootDate).getTime()
  const msSinceShoot = Date.now() - shootTime
  const windowOpen = msSinceShoot >= 0 && msSinceShoot <= 72 * HOUR_MS

  function onSubmit(values: RaiseDisputeInput) {
    raise.mutate(values)
  }

  return (
    <div className="space-y-6">
      <BackLink bookingId={bookingId} />
      <PageHeader
        title="Raise a dispute"
        description={booking.data?.job?.title ?? 'Booking dispute'}
      />

      {!windowOpen ? (
        <Card className="p-6 text-sm text-muted-foreground">
          The 72-hour dispute window has closed. Disputes can only be raised within 72 hours of the
          shoot date.
        </Card>
      ) : (
        <>
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Opening a dispute freezes escrow until an admin resolves it. Only raise one if you can’t
            settle the issue directly.
          </div>

          <Card className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Select
                  onValueChange={(v) =>
                    form.setValue('reason', v as DisputeReason, { shouldValidate: true })
                  }
                >
                  <SelectTrigger id="reason">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(DISPUTE_REASON_LABEL) as DisputeReason[]).map((r) => (
                      <SelectItem key={r} value={r}>
                        {DISPUTE_REASON_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.reason ? (
                  <p className="text-sm text-destructive">Please select a reason.</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">What happened?</Label>
                <Textarea
                  id="description"
                  rows={6}
                  maxLength={2000}
                  placeholder="Describe the issue in detail (at least 50 characters)…"
                  {...form.register('description')}
                />
                {form.formState.errors.description ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">At least 50 characters.</p>
                )}
              </div>

              <Button type="submit" variant="destructive" disabled={raise.isPending}>
                {raise.isPending ? 'Opening dispute…' : 'Open dispute'}
              </Button>
            </form>
          </Card>
        </>
      )}
    </div>
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">{value}</dd>
    </div>
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

function BackLink({ bookingId }: { bookingId: string }) {
  return (
    <Link
      href={`/artist/bookings/${bookingId}`}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" /> Back to booking
    </Link>
  )
}
