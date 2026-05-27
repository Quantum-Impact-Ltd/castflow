'use client'

import Link from 'next/link'
import {
  ChevronLeft,
  Flag,
  ShieldAlert,
  ArrowUpRight,
  MessageSquare,
  Star,
} from 'lucide-react'
import type { Message, Review } from '@castflow/types'
import {
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFlaggedMessages, useFlaggedReviews } from '@/lib/hooks/use-admin'
import { Stars } from '../page'

type FlaggedType = 'message' | 'review'

interface FlaggedDetailClientProps {
  id: string
  type: FlaggedType
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

const ENDPOINT_NOTE =
  'Moderation actions require a backend endpoint that isn’t available yet. To act now, suspend the author from the Users page.'

export function FlaggedDetailClient({ id, type }: FlaggedDetailClientProps) {
  // Only one list query is enabled at a time — the other stays idle.
  const messages = useFlaggedMessages({ limit: 100 })
  const reviews = useFlaggedReviews({ limit: 100 })
  const active = type === 'review' ? reviews : messages

  const backLink = (
    <Link
      href="/admin/flagged"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" /> Back to flagged content
    </Link>
  )

  if (active.isPending) {
    return (
      <div className="space-y-6">
        {backLink}
        <LoadingState variant="detail" />
      </div>
    )
  }

  if (active.isError) {
    return (
      <div className="space-y-6">
        {backLink}
        <ErrorState
          message="We couldn’t load this flagged item."
          onRetry={() => void active.refetch()}
        />
      </div>
    )
  }

  const message =
    type === 'message' ? messages.data?.find((m) => m.id === id) : undefined
  const review = type === 'review' ? reviews.data?.find((r) => r.id === id) : undefined

  if (!message && !review) {
    return (
      <div className="space-y-6">
        {backLink}
        <EmptyState
          title="Flagged item not found"
          description="It may have been resolved, removed, or it’s no longer in the flagged list."
          icon={<Flag className="h-6 w-6" />}
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/flagged">Back to flagged content</Link>
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {backLink}

      {message ? (
        <MessageDetail message={message} />
      ) : review ? (
        <ReviewDetail review={review} />
      ) : null}
    </div>
  )
}

function FlaggedMarker() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
      <Flag className="h-3 w-3" /> Flagged
    </span>
  )
}

function ContextRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={mono ? 'font-mono text-sm text-foreground' : 'text-sm text-foreground'}>
        {value}
      </dd>
    </div>
  )
}

function ModerationActions({ primaryLabel, primaryTitle }: { primaryLabel: string; primaryTitle: string }) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <h2 className="text-sm font-semibold text-foreground">Moderation</h2>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled
          title={primaryTitle}
          className="text-muted-foreground"
        >
          <ShieldAlert className="mr-1.5 h-4 w-4" /> {primaryLabel}
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/users">
            View users <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{ENDPOINT_NOTE}</p>
    </Card>
  )
}

function MessageDetail({ message }: { message: Message }) {
  const flagReason = (message as Message & { flagReason?: string | null }).flagReason ?? null

  return (
    <>
      <PageHeader
        title="Flagged message"
        description="The full message and its context, as captured at flag time."
        eyebrow={
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" /> Message
          </span>
        }
        actions={<FlaggedMarker />}
      />

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-sm font-semibold text-foreground">Content</h2>
        <blockquote className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
          {message.content || (
            <span className="text-muted-foreground italic">No content</span>
          )}
        </blockquote>
      </Card>

      <Card className="p-5">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Context</h2>
        <dl className="divide-y divide-border">
          <ContextRow label="Message ID" value={message.id} mono />
          <ContextRow label="Thread ID" value={message.threadId} mono />
          <ContextRow label="Sender ID" value={message.senderId} mono />
          <ContextRow label="Sent" value={formatDateTime(message.createdAt)} />
          <ContextRow
            label="Read"
            value={message.readAt ? formatDateTime(message.readAt) : 'Unread'}
          />
          {flagReason ? <ContextRow label="Flag reason" value={flagReason} /> : null}
        </dl>
      </Card>

      <ModerationActions
        primaryLabel="Clear flag"
        primaryTitle="Clearing flags requires a backend endpoint (not yet available)"
      />
    </>
  )
}

function ReviewDetail({ review }: { review: Review }) {
  const flagReason = (review as Review & { flagReason?: string | null }).flagReason ?? null
  const revieweeId = review.artistRevieweeId ?? review.casterRevieweeId ?? '—'
  const revieweeLabel = review.artistRevieweeId
    ? 'Reviewee (artist) ID'
    : review.casterRevieweeId
      ? 'Reviewee (caster) ID'
      : 'Reviewee ID'

  return (
    <>
      <PageHeader
        title="Flagged review"
        description="The full review and its context, as captured at flag time."
        eyebrow={
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Star className="h-3.5 w-3.5" /> Review
          </span>
        }
        actions={<FlaggedMarker />}
      />

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Rating</h2>
          <Stars rating={review.rating} />
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Comment</h3>
          <blockquote className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
            {review.comment || (
              <span className="text-muted-foreground italic">No written comment</span>
            )}
          </blockquote>
        </div>
        {review.isRemoved ? (
          <p className="text-xs font-medium text-destructive">This review is already removed.</p>
        ) : null}
      </Card>

      <Card className="p-5">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Context</h2>
        <dl className="divide-y divide-border">
          <ContextRow label="Review ID" value={review.id} mono />
          <ContextRow label="Booking ID" value={review.bookingId} mono />
          <ContextRow label="Reviewer ID" value={review.reviewerId} mono />
          <ContextRow label="Reviewer role" value={review.reviewerRole} />
          <ContextRow label={revieweeLabel} value={revieweeId} mono />
          <ContextRow label="Written" value={formatDateTime(review.createdAt)} />
          {flagReason ? <ContextRow label="Flag reason" value={flagReason} /> : null}
        </dl>
      </Card>

      <ModerationActions
        primaryLabel="Remove review"
        primaryTitle="Removing reviews requires a backend endpoint (not yet available)"
      />
    </>
  )
}
