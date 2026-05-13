'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
} from '@/components/dashboard'
import { useApplications } from '@/lib/hooks/use-admin'
import { formatDate } from '@/lib/utils'

const STATUSES = ['pending', 'approved', 'rejected'] as const

export function ApplicationsClient() {
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('pending')
  const apps = useApplications({ status, limit: 100 })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Artist applications"
        description="Review and approve incoming applications."
      />
      <Tabs value={status} onValueChange={(v) => setStatus(v as (typeof STATUSES)[number])}>
        <TabsList>
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {apps.isPending ? (
        <LoadingState rows={5} />
      ) : apps.isError ? (
        <ErrorState onRetry={() => apps.refetch()} />
      ) : !apps.data?.length ? (
        <EmptyState title="Nothing to review" />
      ) : (
        <ul className="space-y-2">
          {apps.data.map((app) => (
            <li key={app.id}>
              <Link href={`/admin/applications/${app.id}`}>
                <Card className="hover:border-primary/40 transition-colors">
                  <CardContent className="flex items-center justify-between gap-3 pt-6 text-sm">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {app.firstName} {app.lastName ?? ''}
                      </div>
                      <div className="text-muted-foreground text-xs capitalize">
                        {app.artistType} · {app.city ?? '—'} · Submitted {formatDate(app.createdAt)}
                      </div>
                    </div>
                    <StatusBadge status={app.approvalStatus} />
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
