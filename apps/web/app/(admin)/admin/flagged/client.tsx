'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/dashboard'
import { useFlaggedMessages, useFlaggedReviews } from '@/lib/hooks/use-admin'
import { formatDate } from '@/lib/utils'

export function AdminFlaggedClient() {
  const [tab, setTab] = useState<'messages' | 'reviews'>('messages')
  const messages = useFlaggedMessages({ limit: 50 })
  const reviews = useFlaggedReviews({ limit: 50 })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Flagged content"
        description="Auto-flagged messages and reported reviews."
      />
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'messages' | 'reviews')}>
        <TabsList>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'messages' ? (
        messages.isPending ? (
          <LoadingState rows={5} />
        ) : messages.isError ? (
          <ErrorState onRetry={() => messages.refetch()} />
        ) : !messages.data?.length ? (
          <EmptyState title="No flagged messages" />
        ) : (
          <ul className="space-y-2">
            {messages.data.map((m) => (
              <li key={m.id}>
                <Card>
                  <CardContent className="pt-6 text-sm space-y-1">
                    <div className="text-muted-foreground text-xs">
                      Thread {m.threadId} · {formatDate(m.createdAt)}
                    </div>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )
      ) : reviews.isPending ? (
        <LoadingState rows={5} />
      ) : reviews.isError ? (
        <ErrorState onRetry={() => reviews.refetch()} />
      ) : !reviews.data?.length ? (
        <EmptyState title="No flagged reviews" />
      ) : (
        <ul className="space-y-2">
          {reviews.data.map((r) => (
            <li key={r.id}>
              <Card>
                <CardContent className="pt-6 text-sm space-y-1">
                  <div className="text-muted-foreground text-xs">
                    {r.reviewerRole} · {formatDate(r.createdAt)}
                  </div>
                  <p>{'★'.repeat(r.rating)}</p>
                  {r.comment ? <p className="whitespace-pre-wrap">{r.comment}</p> : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
