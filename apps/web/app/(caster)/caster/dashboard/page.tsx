'use client'

import Link from 'next/link'
import { Briefcase, MessageSquare, CalendarCheck, PoundSterling, Plus, ArrowRight } from 'lucide-react'
import {
  PageHeader,
  StatCard,
  StatusBadge,
  LoadingState,
  ErrorState,
  EmptyState,
  Money,
} from '@/components/dashboard'
import { Button } from '@/components/ui/button'
import { useMyJobs } from '@/lib/hooks/use-jobs'
import { useMyBookings } from '@/lib/hooks/use-bookings'
import { useThreads } from '@/lib/hooks/use-messages'
import { formatDate } from '@/lib/utils'

export default function CasterDashboardPage() {
  const jobs = useMyJobs({ limit: 100 })
  const bookings = useMyBookings()
  const threads = useThreads()

  if (jobs.isPending) return <LoadingState rows={3} />
  if (jobs.isError) {
    return <ErrorState message="We couldn’t load your dashboard." onRetry={() => void jobs.refetch()} />
  }

  const now = new Date()
  const allJobs = jobs.data ?? []
  const activeJobs = allJobs.filter((j) => j.status === 'active')
  const bookingList = bookings.data ?? []
  const upcomingShoots = bookingList
    .filter((b) => b.status === 'confirmed' && new Date(b.shootDate).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.shootDate).getTime() - new Date(b.shootDate).getTime())
  const unreadMessages = (threads.data ?? []).reduce((sum, t) => sum + (t.unreadCount ?? 0), 0)

  const spendThisMonth = bookingList
    .filter((b) => {
      if (b.status !== 'confirmed' && b.status !== 'completed') return false
      const created = new Date(b.createdAt)
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    })
    .reduce((sum, b) => sum + Number(b.totalAmount ?? 0), 0)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Your jobs, bids, and upcoming shoots."
        actions={
          <Button asChild>
            <Link href="/caster/jobs/new">
              <Plus className="mr-1.5 h-4 w-4" /> Post a job
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active jobs" value={activeJobs.length} icon={Briefcase} href="/caster/jobs" />
        <StatCard
          label="Unread messages"
          value={unreadMessages}
          icon={MessageSquare}
          href="/caster/messages"
          accent={unreadMessages > 0}
        />
        <StatCard label="Upcoming shoots" value={upcomingShoots.length} icon={CalendarCheck} href="/caster/bookings" />
        <StatCard label="Spend this month" value={<Money amount={spendThisMonth} />} icon={PoundSterling} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Active jobs</h2>
            <Link href="/caster/jobs" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          {activeJobs.length > 0 ? (
            <ul className="space-y-2">
              {activeJobs.slice(0, 5).map((job) => {
                const bidCount = job._count?.bids ?? 0
                return (
                  <li key={job.id}>
                    <Link
                      href={`/caster/jobs/${job.id}`}
                      className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{job.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {bidCount} {bidCount === 1 ? 'bid' : 'bids'} · shoot {formatDate(job.shootDate)}
                        </p>
                      </div>
                      <StatusBadge status={job.status} />
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <EmptyState
              title="No active jobs"
              description="Post a job to start receiving bids from talent."
              icon={<Briefcase className="h-6 w-6" />}
              action={
                <Button asChild size="sm">
                  <Link href="/caster/jobs/new">Post a job</Link>
                </Button>
              }
            />
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Upcoming shoots</h2>
            <Link href="/caster/bookings" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          {bookings.isPending ? (
            <LoadingState rows={2} />
          ) : upcomingShoots.length > 0 ? (
            <ul className="space-y-2">
              {upcomingShoots.slice(0, 5).map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/caster/bookings/${b.id}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{b.job?.title ?? 'Shoot'}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(b.shootDate)}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No upcoming shoots"
              description="Confirmed bookings appear here."
              icon={<CalendarCheck className="h-6 w-6" />}
            />
          )}
        </section>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-card/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">Looking for someone specific?</p>
        <Button asChild variant="outline" className="mt-3">
          <Link href="/caster/talent">
            Search talent <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
