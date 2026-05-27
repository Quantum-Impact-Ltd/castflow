'use client'

import Link from 'next/link'
import { ChevronLeft, Lock, Scale } from 'lucide-react'
import type { DisputeReason } from '@castflow/types'
import { ApiError } from '@/lib/fetcher'
import {
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
} from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDispute } from '@/lib/hooks/use-disputes'
import { formatDate } from '@/lib/utils'

const DISPUTE_REASON_LABEL: Record<DisputeReason, string> = {
  no_show_artist: 'Artist did not show up',
  no_show_caster: 'Caster did not show up',
  payment_issue: 'Payment issue',
  quality_issue: 'Quality issue',
  other: 'Other',
}

export function DisputeDetailClient({ bookingId }: { bookingId: string }) {
  const { data: dispute, isPending, isError, error, refetch } = useDispute(bookingId)

  if (isPending) return <LoadingState variant="detail" />

  if (isError) {
    const status = error instanceof ApiError ? error.status : 0
    if (status === 404 || status === 410) {
      return (
        <div className="space-y-4">
          <BackLink bookingId={bookingId} />
          <EmptyState
            title="No dispute for this booking"
            description="There’s no open or resolved dispute associated with this booking."
            icon={<Scale className="h-6 w-6" />}
            action={
              <Button asChild size="sm" variant="outline">
                <Link href={`/caster/bookings/${bookingId}`}>Back to booking</Link>
              </Button>
            }
          />
        </div>
      )
    }
    return (
      <div className="space-y-4">
        <BackLink bookingId={bookingId} />
        <ErrorState onRetry={() => void refetch()} />
      </div>
    )
  }

  const resolved = dispute.status === 'resolved'

  return (
    <div className="space-y-6">
      <BackLink bookingId={bookingId} />

      <PageHeader
        title="Dispute"
        description="A read-only summary of this dispute."
        actions={<StatusBadge status={dispute.status} />}
      />

      <Card className="space-y-4 p-6">
        <h2 className="text-sm font-semibold text-foreground">Details</h2>
        <dl className="space-y-3">
          <Field label="Reason" value={DISPUTE_REASON_LABEL[dispute.reason]} />
          <Field label="Description" value={dispute.description} />
          <Field label="Opened" value={formatDate(dispute.createdAt)} />
        </dl>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <SubmissionCard
          title="Caster’s statement"
          submission={dispute.casterSubmission}
          submittedAt={dispute.casterSubmittedAt}
        />
        <SubmissionCard
          title="Artist’s statement"
          submission={dispute.artistSubmission}
          submittedAt={dispute.artistSubmittedAt}
        />
      </div>

      {resolved ? (
        <Card className="space-y-3 p-6">
          <h2 className="text-sm font-semibold text-foreground">Outcome</h2>
          <Field label="Resolution" value={resolutionLabel(dispute.resolution)} />
          {dispute.splitArtistPct !== null ? (
            <Field
              label="Split"
              value={`Artist ${dispute.splitArtistPct}% · Caster ${100 - dispute.splitArtistPct}%`}
            />
          ) : null}
          {dispute.adminNotes ? <Field label="Admin notes" value={dispute.adminNotes} /> : null}
          <p className="text-xs text-muted-foreground">Resolved {formatDate(dispute.resolvedAt)}.</p>
        </Card>
      ) : (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          Escrow is frozen while this dispute is open. An admin will review both statements.
        </div>
      )}

      <Button asChild variant="outline">
        <Link href={`/caster/bookings/${bookingId}`}>View booking</Link>
      </Button>
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
      href={`/caster/bookings/${bookingId}`}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" /> Back to booking
    </Link>
  )
}
