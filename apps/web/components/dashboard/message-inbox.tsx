'use client'

import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { LoadingState, ErrorState, EmptyState, PageHeader } from '@/components/dashboard'
import { useThreads } from '@/lib/hooks/use-messages'
import { cn, formatDate } from '@/lib/utils'

interface MessageInboxProps {
  /** Base path for thread links, e.g. "/artist/messages". */
  basePath: string
}

export function MessageInbox({ basePath }: MessageInboxProps) {
  const { data, isPending, isError, refetch } = useThreads()

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Conversations unlock when you’re shortlisted." />

      {isPending ? (
        <LoadingState rows={4} />
      ) : isError ? (
        <ErrorState message="We couldn’t load your messages." onRetry={() => void refetch()} />
      ) : data && data.length > 0 ? (
        <ul className="space-y-2">
          {data.map((thread) => {
            const unread = thread.unreadCount ?? 0
            return (
              <li key={thread.id}>
                <Link
                  href={`${basePath}/${thread.id}`}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageSquare className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          'truncate',
                          unread > 0
                            ? 'font-semibold text-foreground'
                            : 'font-medium text-foreground'
                        )}
                      >
                        {thread.counterparty?.displayName ?? 'Conversation'}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {thread.lastMessageAt ? formatDate(thread.lastMessageAt) : ''}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {thread.job?.title ? `${thread.job.title} · ` : ''}
                      {thread.lastMessagePreview ?? 'No messages yet'}
                    </p>
                  </div>
                  {unread > 0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState
          title="No conversations yet"
          description="When a caster shortlists one of your bids, you’ll be able to message them here."
          icon={<MessageSquare className="h-6 w-6" />}
        />
      )}
    </div>
  )
}
