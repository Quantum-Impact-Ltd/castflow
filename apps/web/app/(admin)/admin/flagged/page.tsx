'use client'

import Link from 'next/link'
import { Flag, MessageSquare, Star, ShieldAlert, ArrowUpRight } from 'lucide-react'
import type { Message, Review } from '@castflow/types'
import {
  PageHeader,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useFlaggedMessages, useFlaggedReviews } from '@/lib/hooks/use-admin'

// formatDate (shared util) is date-only; flagged content benefits from a
// precise timestamp, so format locally without touching the shared helper.
function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

function shortId(id: string): string {
  return id.length > 10 ? `${id.slice(0, 8)}…` : id
}

// The moderation endpoints (clear flag / remove review) don't exist yet, so the
// actions are deliberately disabled. This note keeps the UI honest.
const ENDPOINT_NOTE =
  'Moderation actions require a backend endpoint that isn’t available yet. To act now, suspend the author from the Users page.'

export default function AdminFlaggedPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Flagged content"
        description="Messages and reviews that were automatically flagged for review."
        eyebrow={
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Flag className="h-3.5 w-3.5" /> Moderation
          </span>
        }
      />

      <Tabs defaultValue="messages">
        <TabsList>
          <TabsTrigger value="messages">
            <MessageSquare className="mr-1.5 h-4 w-4" /> Messages
          </TabsTrigger>
          <TabsTrigger value="reviews">
            <Star className="mr-1.5 h-4 w-4" /> Reviews
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-4">
          <FlaggedMessages />
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <FlaggedReviews />
        </TabsContent>
      </Tabs>
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

function ModerationFooter({
  primaryLabel,
  primaryTitle,
  authorHref,
}: {
  primaryLabel: string
  primaryTitle: string
  authorHref: string
}) {
  return (
    <div className="space-y-2 border-t border-border pt-3">
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
          <Link href={authorHref}>
            View author <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{ENDPOINT_NOTE}</p>
    </div>
  )
}

function FlaggedMessages() {
  const { data, isPending, isError, refetch } = useFlaggedMessages({ limit: 100 })

  if (isPending) return <LoadingState rows={4} />
  if (isError) {
    return (
      <ErrorState
        message="We couldn’t load flagged messages."
        onRetry={() => void refetch()}
      />
    )
  }
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Nothing flagged"
        description="No messages are currently flagged for review."
        icon={<MessageSquare className="h-6 w-6" />}
      />
    )
  }

  return (
    <div className="space-y-3">
      {data.map((message) => (
        <FlaggedMessageCard key={message.id} message={message} />
      ))}
    </div>
  )
}

function FlaggedMessageCard({ message }: { message: Message }) {
  // flagReason may be added server-side later; render it only if present.
  const flagReason = (message as Message & { flagReason?: string | null }).flagReason ?? null

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <Link
            href={`/admin/flagged/${message.id}?type=message`}
            className="font-medium text-foreground hover:text-primary hover:underline"
          >
            Message {shortId(message.id)}
          </Link>
          <p className="text-xs text-muted-foreground">
            Sender{' '}
            <span className="font-mono">{shortId(message.senderId)}</span> ·{' '}
            {formatDateTime(message.createdAt)}
          </p>
        </div>
        <FlaggedMarker />
      </div>

      <blockquote className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground">
        {message.content || <span className="text-muted-foreground italic">No content</span>}
      </blockquote>

      {flagReason ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Reason:</span> {flagReason}
        </p>
      ) : null}

      <ModerationFooter
        primaryLabel="Clear flag"
        primaryTitle="Clearing flags requires a backend endpoint (not yet available)"
        authorHref="/admin/users"
      />
    </Card>
  )
}

function FlaggedReviews() {
  const { data, isPending, isError, refetch } = useFlaggedReviews({ limit: 100 })

  if (isPending) return <LoadingState rows={4} />
  if (isError) {
    return (
      <ErrorState
        message="We couldn’t load flagged reviews."
        onRetry={() => void refetch()}
      />
    )
  }
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Nothing flagged"
        description="No reviews are currently flagged for review."
        icon={<Star className="h-6 w-6" />}
      />
    )
  }

  return (
    <div className="space-y-3">
      {data.map((review) => (
        <FlaggedReviewCard key={review.id} review={review} />
      ))}
    </div>
  )
}

function FlaggedReviewCard({ review }: { review: Review }) {
  const flagReason = (review as Review & { flagReason?: string | null }).flagReason ?? null

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <Link
            href={`/admin/flagged/${review.id}?type=review`}
            className="font-medium text-foreground hover:text-primary hover:underline"
          >
            Review {shortId(review.id)}
          </Link>
          <p className="text-xs text-muted-foreground">
            Reviewer{' '}
            <span className="font-mono">{shortId(review.reviewerId)}</span> ·{' '}
            {formatDateTime(review.createdAt)}
          </p>
        </div>
        <FlaggedMarker />
      </div>

      <Stars rating={review.rating} />

      <blockquote className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground">
        {review.comment || (
          <span className="text-muted-foreground italic">No written comment</span>
        )}
      </blockquote>

      {flagReason ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Reason:</span> {flagReason}
        </p>
      ) : null}

      {review.isRemoved ? (
        <p className="text-xs font-medium text-destructive">This review is already removed.</p>
      ) : null}

      <ModerationFooter
        primaryLabel="Remove review"
        primaryTitle="Removing reviews requires a backend endpoint (not yet available)"
        authorHref="/admin/users"
      />
    </Card>
  )
}

export function Stars({ rating }: { rating: number }) {
  const value = Math.max(0, Math.min(5, Math.round(rating)))
  return (
    <div className="flex items-center gap-1.5" title={`${rating} out of 5`}>
      <div className="flex" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={
              i < value
                ? 'h-4 w-4 fill-amber-400 text-amber-400'
                : 'h-4 w-4 text-muted-foreground/40'
            }
          />
        ))}
      </div>
      <span className="text-sm font-medium text-foreground">{rating}/5</span>
    </div>
  )
}
