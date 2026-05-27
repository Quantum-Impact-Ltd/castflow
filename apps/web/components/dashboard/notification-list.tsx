'use client'

import Link from 'next/link'
import {
  Bell,
  Check,
  Trash2,
  FileText,
  CalendarCheck,
  MessageSquare,
  Scale,
  Wallet,
  Star,
  BadgeCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Notification } from '@castflow/types'
import { PageHeader, LoadingState, ErrorState, EmptyState } from '@/components/dashboard'
import { Button } from '@/components/ui/button'
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
  useDeleteNotification,
} from '@/lib/hooks/use-notifications'
import { cn, formatDate } from '@/lib/utils'

function iconForType(type: string): LucideIcon {
  if (type.startsWith('bid')) return FileText
  if (type.startsWith('booking') || type.startsWith('contract')) return CalendarCheck
  if (type.startsWith('payment') || type === 'payout_sent') return Wallet
  if (type.startsWith('dispute')) return Scale
  if (type === 'message_received') return MessageSquare
  if (type === 'review_received') return Star
  if (type.startsWith('artist_')) return BadgeCheck
  return Bell
}

/** Resolve a deep link for a notification within the given role base path. */
function hrefFor(n: Notification, basePath: string): string | null {
  const id = n.relatedEntityId
  switch (n.relatedEntityType) {
    case 'booking':
      return id ? `${basePath}/bookings/${id}` : null
    case 'bid':
      return id ? `${basePath}/bids/${id}` : null
    case 'job':
      return id ? `${basePath}/jobs/${id}` : null
    case 'dispute':
      return id ? `${basePath}/disputes/${id}` : null
    case 'thread':
    case 'message':
    case 'message_thread':
      return id ? `${basePath}/messages/${id}` : null
    default:
      return null
  }
}

interface NotificationListProps {
  /** Role base path for deep links, e.g. "/artist". */
  basePath: string
}

export function NotificationList({ basePath }: NotificationListProps) {
  const { data, isPending, isError, refetch } = useNotifications({ limit: 100 })
  const markRead = useMarkRead()
  const markAllRead = useMarkAllRead()
  const remove = useDeleteNotification()

  const hasUnread = (data ?? []).some((n) => !n.readAt)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Everything happening across your shoots and bids."
        actions={
          hasUnread ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <Check className="mr-1.5 h-4 w-4" /> Mark all read
            </Button>
          ) : undefined
        }
      />

      {isPending ? (
        <LoadingState rows={5} />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : data && data.length > 0 ? (
        <ul className="space-y-2">
          {data.map((n) => {
            const Icon = iconForType(n.type)
            const href = hrefFor(n, basePath)
            const unread = !n.readAt
            const inner = (
              <div
                className={cn(
                  'flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors',
                  unread ? 'border-primary/40 bg-accent/30' : 'border-border'
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                    unread ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatDate(n.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {unread ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label="Mark read"
                      onClick={(e) => {
                        e.preventDefault()
                        markRead.mutate([n.id])
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    aria-label="Delete"
                    onClick={(e) => {
                      e.preventDefault()
                      remove.mutate(n.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
            return (
              <li key={n.id}>
                {href ? (
                  <Link href={href} onClick={() => unread && markRead.mutate([n.id])}>
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState
          title="You’re all caught up"
          description="Notifications about your bids, bookings, and messages will appear here."
          icon={<Bell className="h-6 w-6" />}
        />
      )}
    </div>
  )
}
