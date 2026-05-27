'use client'

import Link from 'next/link'
import { FileText, CalendarCheck, MessageSquare, Sparkles, ArrowRight, Wallet, Mail } from 'lucide-react'
import {
  PageHeader,
  StatCard,
  StatusBadge,
  LoadingState,
  ErrorState,
  EmptyState,
  Money,
} from '@/components/dashboard'
import { AvailabilityToggle } from '@/components/dashboard/availability-toggle'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMyArtistProfile } from '@/lib/hooks/use-artist'
import { useMyBids } from '@/lib/hooks/use-bids'
import { useMyBookings } from '@/lib/hooks/use-bookings'
import { useMyInvites } from '@/lib/hooks/use-invites'
import { useThreads } from '@/lib/hooks/use-messages'
import { useConnectStatus } from '@/lib/hooks/use-payments'
import { formatDate } from '@/lib/utils'

export default function ArtistDashboardPage() {
  const profile = useMyArtistProfile()
  const pendingBids = useMyBids({ status: 'pending' })
  const bookings = useMyBookings()
  const invites = useMyInvites({ status: 'pending' })
  const threads = useThreads()
  const connect = useConnectStatus()

  if (profile.isPending) return <LoadingState rows={3} />
  if (profile.isError || !profile.data) {
    return <ErrorState message="We couldn’t load your dashboard." onRetry={() => void profile.refetch()} />
  }

  const me = profile.data
  const now = Date.now()

  const bookingList = bookings.data ?? []
  const upcomingShoots = bookingList
    .filter((b) => b.status === 'confirmed' && new Date(b.shootDate).getTime() >= now)
    .sort((a, b) => new Date(a.shootDate).getTime() - new Date(b.shootDate).getTime())
  const completedCount = bookingList.filter((b) => b.status === 'completed').length
  const unreadMessages = (threads.data ?? []).reduce((sum, t) => sum + (t.unreadCount ?? 0), 0)
  const isNewToPlatform = me.ratingCount === 0 && completedCount === 0

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${me.firstName}`}
        description="Your bids, shoots, and messages at a glance."
        actions={
          <Button asChild>
            <Link href="/artist/jobs">
              Browse jobs <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        }
      />

      {isNewToPlatform ? (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--brand-200)] bg-[var(--brand-50)] px-4 py-3">
          <Badge className="bg-[var(--brand-500)] text-white">New to Platform</Badge>
          <p className="text-sm text-[var(--brand-700)]">
            You don’t have any reviews yet — land your first booking to start building your reputation.
          </p>
        </div>
      ) : null}

      {connect.data && !connect.data.payoutsEnabled ? (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-800">
              Connect a bank account so you can be paid when a shoot completes.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/artist/earnings/payout">Set up payouts</Link>
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pending bids"
          value={pendingBids.data?.length ?? '—'}
          icon={FileText}
          href="/artist/bids"
        />
        <StatCard
          label="Upcoming shoots"
          value={upcomingShoots.length}
          icon={CalendarCheck}
          href="/artist/bookings"
        />
        <StatCard
          label="Unread messages"
          value={unreadMessages}
          icon={MessageSquare}
          href="/artist/messages"
          accent={unreadMessages > 0}
        />
        <Card className="flex flex-col justify-center gap-2 p-5">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Availability
          </span>
          <AvailabilityToggle status={me.availabilityStatus} compact />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending bids */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Pending bids</h2>
            <Link href="/artist/bids" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          {pendingBids.isPending ? (
            <LoadingState rows={2} />
          ) : pendingBids.isError ? (
            <ErrorState onRetry={() => void pendingBids.refetch()} />
          ) : pendingBids.data && pendingBids.data.length > 0 ? (
            <ul className="space-y-2">
              {pendingBids.data.slice(0, 5).map((bid) => (
                <li key={bid.id}>
                  <Link
                    href={`/artist/bids/${bid.id}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {bid.job?.title ?? 'Job'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <Money amount={bid.proposedRate} />
                        {bid.job?.paymentType === 'hourly' ? '/hr' : ''} · {formatDate(bid.submittedAt)}
                      </p>
                    </div>
                    <StatusBadge status={bid.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No pending bids"
              description="Find a shoot that fits and submit your first bid."
              icon={<FileText className="h-6 w-6" />}
              action={
                <Button asChild size="sm" variant="outline">
                  <Link href="/artist/jobs">Browse the job feed</Link>
                </Button>
              }
            />
          )}
        </section>

        {/* Upcoming shoots */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Upcoming shoots</h2>
            <Link href="/artist/bookings" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          {bookings.isPending ? (
            <LoadingState rows={2} />
          ) : bookings.isError ? (
            <ErrorState onRetry={() => void bookings.refetch()} />
          ) : upcomingShoots.length > 0 ? (
            <ul className="space-y-2">
              {upcomingShoots.slice(0, 5).map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/artist/bookings/${b.id}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{b.job?.title ?? 'Shoot'}</p>
                      <p className="text-sm text-muted-foreground">
                        {b.caster?.companyName} · {formatDate(b.shootDate)}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No upcoming shoots"
              description="Confirmed bookings will appear here with their shoot dates."
              icon={<CalendarCheck className="h-6 w-6" />}
            />
          )}
        </section>
      </div>

      {/* Pending invitations */}
      {invites.data && invites.data.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Invitations to apply</h2>
            <Link href="/artist/invites" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <ul className="space-y-2">
            {invites.data.slice(0, 3).map((invite) => (
              <li key={invite.id}>
                <Link
                  href="/artist/invites"
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="truncate font-medium text-foreground">
                      {invite.job?.title ?? 'A caster invited you to apply'}
                    </p>
                  </div>
                  <Sparkles className="h-4 w-4 text-[var(--cta-500)]" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
