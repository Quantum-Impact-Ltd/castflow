'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Trash2 } from 'lucide-react'
import { EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/dashboard'
import {
  useDeleteNotification,
  useMarkAllRead,
  useMarkRead,
  useNotifications,
} from '@/lib/hooks/use-notifications'
import { formatDate } from '@/lib/utils'

export function NotificationsClient() {
  const notifications = useNotifications({ limit: 100 })
  const markAll = useMarkAllRead()
  const markOne = useMarkRead()
  const del = useDeleteNotification()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
          >
            Mark all read
          </Button>
        }
      />

      {notifications.isPending ? (
        <LoadingState rows={4} />
      ) : notifications.isError ? (
        <ErrorState onRetry={() => notifications.refetch()} />
      ) : !notifications.data?.length ? (
        <EmptyState title="You're all caught up" />
      ) : (
        <ul className="space-y-2">
          {notifications.data.map((n) => (
            <li key={n.id}>
              <Card className={n.readAt ? '' : 'border-primary/40'}>
                <CardContent className="flex items-start justify-between gap-3 pt-6">
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{n.title}</div>
                    <div className="text-muted-foreground text-xs">{n.body}</div>
                    <div className="text-muted-foreground text-xs">{formatDate(n.createdAt)}</div>
                  </div>
                  <div className="flex gap-1">
                    {!n.readAt ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => markOne.mutate([n.id])}
                        aria-label="Mark read"
                      >
                        <Check className="size-4" />
                      </Button>
                    ) : null}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => del.mutate(n.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
