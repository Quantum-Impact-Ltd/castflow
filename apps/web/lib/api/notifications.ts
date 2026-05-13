import type { Notification } from '@castflow/types'
import { fetcher } from '@/lib/fetcher'
import type { Init } from './types'

export function listNotifications(
  filters: { unreadOnly?: boolean; cursor?: string; limit?: number } = {},
  init?: Init
) {
  return fetcher<Notification[]>('/notifications', { params: filters, ...init })
}

export function markRead(ids: string[]) {
  return fetcher<{ count: number }>('/notifications/read', {
    method: 'POST',
    body: { ids },
  })
}

export function markAllRead() {
  return fetcher<{ count: number }>('/notifications/read-all', { method: 'POST' })
}

export function deleteNotification(id: string) {
  return fetcher<{ ok: true }>(`/notifications/${id}`, { method: 'DELETE' })
}
