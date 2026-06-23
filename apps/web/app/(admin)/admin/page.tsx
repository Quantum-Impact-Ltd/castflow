'use client'

import Link from 'next/link'
import { Users, ClipboardList, Scale, CreditCard, CalendarCheck, Flag, ArrowRight } from 'lucide-react'
import { PageHeader, StatCard, LoadingState, ErrorState } from '@/components/dashboard'
import { Card } from '@/components/ui/card'
import { useAdminAnalytics } from '@/lib/hooks/use-admin'

export default function AdminDashboardPage() {
  const { data, isPending, isError, refetch } = useAdminAnalytics()

  if (isPending) return <LoadingState rows={3} />
  if (isError || !data) {
    return <ErrorState message="We couldn’t load the admin overview." onRetry={() => void refetch()} />
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Admin overview" description="Operational health at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total users"
          value={data.totalUsers}
          icon={Users}
          hint={`${data.totalArtists} artists · ${data.totalCasters} casters`}
          href="/admin/users"
        />
        <StatCard
          label="Pending applications"
          value={data.pendingApplications}
          icon={ClipboardList}
          href="/admin/applications"
          accent={data.pendingApplications > 0}
        />
        <StatCard
          label="Open disputes"
          value={data.openDisputes}
          icon={Scale}
          href="/admin/disputes"
          accent={data.openDisputes > 0}
        />
        <StatCard
          label="Active subscriptions"
          value={data.activeSubscriptions}
          icon={CreditCard}
        />
        <StatCard
          label="Bookings this week"
          value={data.bookingsThisWeek}
          icon={CalendarCheck}
          href="/admin/bookings"
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Action queues</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <QueueCard
            href="/admin/applications"
            icon={ClipboardList}
            title="Application queue"
            description="Review and approve new artists."
            count={data.pendingApplications}
          />
          <QueueCard
            href="/admin/disputes"
            icon={Scale}
            title="Disputes"
            description="Resolve open and in-review disputes."
            count={data.openDisputes}
          />
          <QueueCard
            href="/admin/flagged"
            icon={Flag}
            title="Flagged content"
            description="Review reported messages and reviews."
          />
        </div>
      </section>
    </div>
  )
}

function QueueCard({
  href,
  icon: Icon,
  title,
  description,
  count,
}: {
  href: string
  icon: typeof ClipboardList
  title: string
  description: string
  count?: number
}) {
  return (
    <Link href={href} className="block">
      <Card className="flex h-full flex-col gap-3 p-5 transition-colors hover:border-primary/40">
        <div className="flex items-center justify-between">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          {count !== undefined && count > 0 ? (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground">
              {count}
            </span>
          ) : null}
        </div>
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="mt-auto inline-flex items-center text-sm text-primary">
          Open <ArrowRight className="ml-1 h-4 w-4" />
        </span>
      </Card>
    </Link>
  )
}
