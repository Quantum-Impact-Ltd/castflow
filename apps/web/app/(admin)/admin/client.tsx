'use client'

import Link from 'next/link'
import { ClipboardList, ShieldAlert, Users, CreditCard, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatCard,
  StatusBadge,
} from '@/components/dashboard'
import { useAdminAnalytics, useAdminDisputes, useApplications } from '@/lib/hooks/use-admin'
import { formatCurrency, formatDate } from '@/lib/utils'

export function AdminDashboardClient() {
  const analytics = useAdminAnalytics()
  const applications = useApplications({ status: 'pending', limit: 5 })
  const disputes = useAdminDisputes({ status: 'open', limit: 5 })

  const a = analytics.data
  return (
    <div className="space-y-8">
      <PageHeader title="Operations" description="Platform overview and pending actions." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Total users"
          value={a ? a.totalUsers : '—'}
          hint={a ? `${a.totalArtists} artists · ${a.totalCasters} casters` : undefined}
          icon={Users}
        />
        <StatCard
          label="Pending apps"
          value={a ? a.pendingApplications : '—'}
          icon={ClipboardList}
        />
        <StatCard label="Open disputes" value={a ? a.openDisputes : '—'} icon={ShieldAlert} />
        <StatCard label="Bookings (week)" value={a ? a.bookingsThisWeek : '—'} icon={Calendar} />
        <StatCard
          label="Revenue (month)"
          value={a ? formatCurrency(a.revenueThisMonth) : '—'}
          icon={CreditCard}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base">Pending applications</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/applications">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {applications.isPending ? (
              <LoadingState rows={3} />
            ) : applications.isError ? (
              <ErrorState onRetry={() => applications.refetch()} />
            ) : !applications.data?.length ? (
              <EmptyState title="Queue is empty" />
            ) : (
              <ul className="divide-border divide-y">
                {applications.data.map((app) => (
                  <li key={app.id}>
                    <Link
                      href={`/admin/applications/${app.id}`}
                      className="flex items-center justify-between py-3 text-sm hover:underline"
                    >
                      <span>
                        {app.firstName} {app.lastName ?? ''} · {app.artistType}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatDate(app.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base">Open disputes</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/disputes">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {disputes.isPending ? (
              <LoadingState rows={3} />
            ) : disputes.isError ? (
              <ErrorState onRetry={() => disputes.refetch()} />
            ) : !disputes.data?.length ? (
              <EmptyState title="No open disputes" />
            ) : (
              <ul className="divide-border divide-y">
                {disputes.data.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/admin/disputes/${d.bookingId}`}
                      className="flex items-center justify-between py-3 text-sm hover:underline"
                    >
                      <span className="capitalize">{d.reason.replace(/_/g, ' ')}</span>
                      <StatusBadge status={d.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
