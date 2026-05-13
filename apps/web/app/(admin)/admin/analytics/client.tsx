'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState, LoadingState, PageHeader, StatCard } from '@/components/dashboard'
import { useAdminAnalytics } from '@/lib/hooks/use-admin'
import { formatCurrency, formatDate } from '@/lib/utils'

export function AdminAnalyticsClient() {
  const analytics = useAdminAnalytics()
  if (analytics.isPending) return <LoadingState rows={6} />
  if (analytics.isError || !analytics.data)
    return <ErrorState onRetry={() => analytics.refetch()} />
  const a = analytics.data
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Platform health and growth." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Users" value={a.totalUsers} hint={`${a.totalArtists} artists`} />
        <StatCard label="Pending apps" value={a.pendingApplications} />
        <StatCard label="Open disputes" value={a.openDisputes} />
        <StatCard label="Revenue (month)" value={formatCurrency(a.revenueThisMonth)} />
        <StatCard label="Booking fill rate" value={`${Math.round(a.bookingFillRate * 100)}%`} />
        <StatCard label="Dispute rate" value={`${Math.round(a.disputeRate * 100)}%`} />
        <StatCard
          label="Time to booking"
          value={a.avgTimeToBookingHours != null ? `${Math.round(a.avgTimeToBookingHours)}h` : '—'}
        />
        <StatCard label="Bookings (week)" value={a.bookingsThisWeek} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New users per week</CardTitle>
          </CardHeader>
          <CardContent>
            {a.newUsersWeekly?.length ? (
              <ul className="space-y-1 text-sm">
                {a.newUsersWeekly.map((w) => (
                  <li key={w.weekStart} className="flex justify-between">
                    <span className="text-muted-foreground">{formatDate(w.weekStart)}</span>
                    <span>{w.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">No data yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jobs posted per week</CardTitle>
          </CardHeader>
          <CardContent>
            {a.jobsWeekly?.length ? (
              <ul className="space-y-1 text-sm">
                {a.jobsWeekly.map((w) => (
                  <li key={w.weekStart} className="flex justify-between">
                    <span className="text-muted-foreground">{formatDate(w.weekStart)}</span>
                    <span>{w.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">No data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
