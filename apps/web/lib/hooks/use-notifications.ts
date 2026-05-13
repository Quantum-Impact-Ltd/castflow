'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import {
  deleteNotification,
  listNotifications,
  markAllRead,
  markRead,
} from '@/lib/api/notifications'
import { errorMessage } from './util'

export function useNotifications(filters: { unreadOnly?: boolean; limit?: number } = {}) {
  return useQuery({
    queryKey: [...queryKeys.notifications.all(), filters],
    queryFn: ({ signal }) => listNotifications(filters, { signal }),
  })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => markRead(ids),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.notifications.all() }),
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => markAllRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.notifications.all() })
      toast.success('All notifications marked as read')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useDeleteNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.notifications.all() }),
    onError: (err) => toast.error(errorMessage(err)),
  })
}
