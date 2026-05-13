'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/dashboard'
import { useThreads } from '@/lib/hooks/use-messages'
import { formatDate } from '@/lib/utils'

interface InboxProps {
  basePath: string
}

export function MessagesInbox({ basePath }: InboxProps) {
  const threads = useThreads()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Conversations unlock once an artist is shortlisted on a job."
      />

      {threads.isPending ? (
        <LoadingState rows={4} />
      ) : threads.isError ? (
        <ErrorState onRetry={() => threads.refetch()} />
      ) : !threads.data?.length ? (
        <EmptyState
          title="No conversations"
          description="Shortlisted talent will be reachable here."
        />
      ) : (
        <ul className="space-y-2">
          {threads.data.map((t) => (
            <li key={t.id}>
              <Link href={`${basePath}/${t.id}`}>
                <Card className="hover:border-primary/40 transition-colors">
                  <CardContent className="flex items-center justify-between gap-3 pt-6">
                    <div className="space-y-1">
                      <div className="font-medium text-sm">
                        {t.counterparty?.displayName ?? 'Conversation'}
                      </div>
                      <div className="text-muted-foreground text-xs">{t.job?.title ?? 'Job'}</div>
                      {t.lastMessagePreview ? (
                        <div className="text-muted-foreground line-clamp-1 text-xs">
                          {t.lastMessagePreview}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {t.lastMessageAt ? formatDate(t.lastMessageAt) : ''}
                      {t.unreadCount ? (
                        <span className="bg-primary text-primary-foreground ml-2 rounded-full px-2 py-0.5 text-xs">
                          {t.unreadCount}
                        </span>
                      ) : null}
                    </div>
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
