'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from '@/components/dashboard'
import { useAdminJobs } from '@/lib/hooks/use-admin'
import { formatDate } from '@/lib/utils'

const STATUSES = ['all', 'active', 'filled', 'cancelled', 'expired'] as const

export function AdminJobsClient() {
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('all')
  const jobs = useAdminJobs(status === 'all' ? { limit: 100 } : { status, limit: 100 })

  return (
    <div className="space-y-6">
      <PageHeader title="Jobs" description="Every job posted on the platform." />
      <Tabs value={status} onValueChange={(v) => setStatus(v as (typeof STATUSES)[number])}>
        <TabsList>
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {jobs.isPending ? (
        <LoadingState rows={5} />
      ) : jobs.isError ? (
        <ErrorState onRetry={() => jobs.refetch()} />
      ) : !jobs.data?.length ? (
        <EmptyState title="No matching jobs" />
      ) : (
        <ul className="space-y-2">
          {jobs.data.map((j) => (
            <li key={j.id}>
              <Link href={`/admin/jobs/${j.id}`}>
                <Card className="hover:border-primary/40 transition-colors">
                  <CardContent className="flex items-center justify-between gap-3 pt-6 text-sm">
                    <div className="space-y-1">
                      <div className="font-medium">{j.title}</div>
                      <div className="text-muted-foreground text-xs">
                        {j.category} · {j.locationCity} · Shoot {formatDate(j.shootDate)}
                      </div>
                    </div>
                    <StatusBadge status={j.status} />
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
