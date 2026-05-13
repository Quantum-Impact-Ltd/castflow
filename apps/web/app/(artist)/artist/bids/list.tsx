'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '@/components/dashboard'
import { useMyBids } from '@/lib/hooks/use-bids'
import { formatCurrency, formatDate } from '@/lib/utils'

const STATUSES = ['all', 'pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn'] as const

export function ArtistBidsList() {
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('all')
  const bids = useMyBids(status === 'all' ? { limit: 100 } : { status, limit: 100 })

  return (
    <div className="space-y-4">
      <Tabs value={status} onValueChange={(v) => setStatus(v as (typeof STATUSES)[number])}>
        <TabsList>
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {bids.isPending ? (
        <LoadingState rows={4} />
      ) : bids.isError ? (
        <ErrorState onRetry={() => bids.refetch()} />
      ) : !bids.data?.length ? (
        <EmptyState title="No bids" description="Bids in this status will appear here." />
      ) : (
        <ul className="space-y-3">
          {bids.data.map((b) => (
            <li key={b.id}>
              <Link href={`/artist/bids/${b.id}`}>
                <Card className="hover:border-primary/40 transition-colors">
                  <CardContent className="flex items-center justify-between gap-3 pt-6 text-sm">
                    <div className="space-y-1">
                      <div className="font-medium">{formatCurrency(b.proposedRate)}</div>
                      <div className="text-muted-foreground text-xs">
                        Submitted {formatDate(b.submittedAt)}
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
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
