'use client'

import Link from 'next/link'
import {
  ChevronLeft,
  Flag,
  ShieldCheck,
  Trash2,
  ArrowUpRight,
  MessageSquare,
  Star,
  ShieldAlert,
  UserCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FlaggedMessageRow, FlaggedReviewRow, FlaggedParticipant } from '@/lib/api/admin'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  useFlaggedMessages,
  useFlaggedReviews,
  useFlaggedMessageContext,
  useClearFlaggedMessage,
  useClearFlaggedReview,
  useRemoveFlaggedReview,
} from '@/lib/hooks/use-admin'
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

  const message = type === 'message' ? messages.data?.find((m) => m.id === id) : undefined
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

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  )
}

function ParticipantCard({
  participant,
  role,
  tag,
}: {
  participant: FlaggedParticipant | null
  role: string
  tag: { label: string; tone: 'reported' | 'reporter' } | null
}) {
  if (!participant) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        {role}: unknown
      </div>
    )
  }
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-4">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">{participant.name}</p>
          {tag ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
                tag.tone === 'reported'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-emerald-100 text-emerald-700'
              )}
            >
              {tag.tone === 'reported' ? (
                <ShieldAlert className="h-2.5 w-2.5" />
              ) : (
                <UserCheck className="h-2.5 w-2.5" />
              )}
              {tag.label}
            </span>
          ) : null}
        </div>
        <p className="text-xs capitalize text-muted-foreground">{role}</p>
      </div>
      <Button asChild variant="ghost" size="sm" className="shrink-0">
        <Link href={`/admin/users/${participant.userId}`}>
          View <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  )
}

function MessageDetail({ message }: { message: FlaggedMessageRow }) {
  const clear = useClearFlaggedMessage()
  const ctx = useFlaggedMessageContext(message.id)

  const reportedParty = ctx.data?.reportedParty ?? null
  const casterTag =
    reportedParty === 'caster'
      ? ({ label: 'Reported party', tone: 'reported' } as const)
      : reportedParty === 'artist'
        ? ({ label: 'Reporter', tone: 'reporter' } as const)
        : null
  const artistTag =
    reportedParty === 'artist'
      ? ({ label: 'Reported party', tone: 'reported' } as const)
      : reportedParty === 'caster'
        ? ({ label: 'Reporter', tone: 'reporter' } as const)
        : null
  const reportedUser = reportedParty ? (ctx.data?.participants[reportedParty] ?? null) : null

  return (
    <>
      <PageHeader
        title="Flagged message"
        description="The flagged message in the context of the full conversation."
        eyebrow={
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" /> Message
          </span>
        }
        actions={<FlaggedMarker />}
      />

      {/* Participants — reporter vs reported, with deep-links to the Users page */}
      <Card className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Participants</h2>
          {ctx.data?.job ? (
            <span className="truncate text-xs text-muted-foreground">{ctx.data.job.title}</span>
          ) : null}
        </div>
        {ctx.isPending ? (
          <p className="text-sm text-muted-foreground">Loading conversation context…</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <ParticipantCard
              participant={ctx.data?.participants.caster ?? null}
              role="Caster"
              tag={casterTag}
            />
            <ParticipantCard
              participant={ctx.data?.participants.artist ?? null}
              role="Artist"
              tag={artistTag}
            />
          </div>
        )}
        {/* Persisted reports — real reporter identity, reason, and outcome */}
        {ctx.data && ctx.data.reports.length > 0 ? (
          <ul className="space-y-2">
            {ctx.data.reports.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <span className="font-medium">{r.reporterName}</span>
                    <span className="text-amber-700"> ({r.reporterRole})</span> reported this —{' '}
                    <span className="font-medium capitalize">{r.reason.replace(/_/g, ' ')}</span>
                  </span>
                  <span className="inline-flex items-center gap-2 text-amber-700">
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium capitalize">
                      {r.status}
                    </span>
                    {formatDateTime(r.createdAt)}
                  </span>
                </div>
                {r.detail ? <p className="mt-1 text-amber-800">“{r.detail}”</p> : null}
              </li>
            ))}
          </ul>
        ) : message.flagReason ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <span className="font-medium">Flag reason:</span> {message.flagReason}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Auto-flagged for possible off-platform contact details (no manual report reason).
          </p>
        )}
      </Card>

      {/* Conversation context */}
      <Card className="space-y-3 p-5">
        <h2 className="text-sm font-semibold text-foreground">
          Conversation
          {ctx.data ? (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {ctx.data.flaggedCount} flagged of {ctx.data.conversation.length}
            </span>
          ) : null}
        </h2>
        {ctx.isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : ctx.isError ? (
          <ErrorState
            message="Couldn’t load the conversation."
            onRetry={() => void ctx.refetch()}
          />
        ) : (
          <ul className="space-y-2">
            {(ctx.data?.conversation ?? []).map((m) => (
              <li
                key={m.id}
                className={cn(
                  'rounded-lg border p-3',
                  m.isSubject
                    ? 'border-amber-300 bg-amber-50'
                    : m.isFlagged
                      ? 'border-amber-200 bg-amber-50/40'
                      : 'border-border bg-card'
                )}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium capitalize text-foreground">
                    {m.senderName}
                    <span className="ml-1.5 font-normal text-muted-foreground">
                      ({m.senderRole})
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {formatDateTime(m.createdAt)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                  {m.content}
                </p>
                {m.isFlagged ? (
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-700">
                    <Flag className="h-3 w-3" /> {m.flagReason ?? 'Flagged'}
                    {m.isSubject ? ' · this message' : ''}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-sm font-semibold text-foreground">Moderation</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={clear.isPending}
            onClick={() => clear.mutate({ id: message.id })}
          >
            <ShieldCheck className="mr-1.5 h-4 w-4" />{' '}
            {clear.isPending ? 'Clearing…' : 'Clear flag'}
          </Button>
          {reportedUser ? (
            <Button asChild variant="ghost" size="sm" className="text-destructive">
              <Link href={`/admin/users/${reportedUser.userId}`}>
                <ShieldAlert className="mr-1 h-3.5 w-3.5" /> Review reported user
              </Link>
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Clearing dismisses the flag (content stays). For stronger action, suspend or ban the
          reported user from their Users page.
        </p>
      </Card>
    </>
  )
}

function ReviewDetail({ review }: { review: FlaggedReviewRow }) {
  const clear = useClearFlaggedReview()
  const remove = useRemoveFlaggedReview()
  const busy = clear.isPending || remove.isPending

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
          <ContextRow label="Reviewer" value={review.reviewerName ?? 'Unknown'} />
          <ContextRow label="Reviewer role" value={review.reviewerRole} />
          <ContextRow label="Reviewee" value={review.revieweeName ?? 'Unknown'} />
          <ContextRow label="Written" value={formatDateTime(review.createdAt)} />
          {review.flagReason ? <ContextRow label="Flag reason" value={review.flagReason} /> : null}
        </dl>
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="text-sm font-semibold text-foreground">Moderation</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={busy || review.isRemoved}
            onClick={() => remove.mutate({ id: review.id })}
          >
            <Trash2 className="mr-1.5 h-4 w-4" /> {remove.isPending ? 'Removing…' : 'Remove review'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => clear.mutate({ id: review.id })}
          >
            <ShieldCheck className="mr-1.5 h-4 w-4" />{' '}
            {clear.isPending ? 'Clearing…' : 'Clear flag'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Removing takes the review out of public view; it stays on record for audit.
        </p>
      </Card>
    </>
  )
}
