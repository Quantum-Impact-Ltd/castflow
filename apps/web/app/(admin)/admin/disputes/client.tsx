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
import { useAdminDisputes } from '@/lib/hooks/use-admin'
import { formatDate } from '@/lib/utils'

const STATUSES = ['open', 'under_review', 'resolved', 'escalated'] as const

export function AdminDisputesClient() {
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('open')
  const disputes = useAdminDisputes({ status, limit: 100 })

  return (
    <div className="space-y-6">
      <PageHeader title="Disputes" />
      <Tabs value={status} onValueChange={(v) => setStatus(v as (typeof STATUSES)[number])}>
        <TabsList>
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s.replace(/_/g, ' ')}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {disputes.isPending ? (
        <LoadingState rows={4} />
      ) : disputes.isError ? (
        <ErrorState onRetry={() => disputes.refetch()} />
      ) : !disputes.data?.length ? (
        <EmptyState title="No disputes in this status" />
      ) : (
        <ul className="space-y-2">
          {disputes.data.map((d) => (
            <li key={d.id}>
              <Link href={`/admin/disputes/${d.bookingId}`}>
                <Card className="hover:border-primary/40 transition-colors">
                  <CardContent className="flex items-center justify-between gap-3 pt-6 text-sm">
                    <div className="space-y-1">
                      <div className="font-medium capitalize">{d.reason.replace(/_/g, ' ')}</div>
                      <div className="text-muted-foreground text-xs">
                        Opened {formatDate(d.createdAt)}
                      </div>
                    </div>
                    <StatusBadge status={d.status} />
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
