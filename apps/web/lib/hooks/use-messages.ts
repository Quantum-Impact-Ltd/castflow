'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import {
  listMessages,
  listThreads,
  markThreadRead,
  sendMessage,
  reportThread,
  type ReportThreadReason,
} from '@/lib/api/messages'
import { errorMessage } from './util'

export function useThreads() {
  return useQuery({
    queryKey: queryKeys.threads.inbox(),
    queryFn: ({ signal }) => listThreads({ signal }),
  })
}

export function useMessages(threadId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.messages.forThread(threadId ?? ''),
    queryFn: ({ signal }) => listMessages(threadId!, {}, { signal }),
    enabled: Boolean(threadId),
  })
}

export function useSendMessage(threadId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => sendMessage(threadId, content),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.messages.forThread(threadId) })
      void qc.invalidateQueries({ queryKey: queryKeys.threads.inbox() })
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useMarkThreadRead(threadId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => markThreadRead(threadId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.threads.inbox() })
    },
  })
}

export function useReportThread(threadId: string) {
  return useMutation({
    mutationFn: ({ reason, detail }: { reason: ReportThreadReason; detail?: string }) =>
      reportThread(threadId, reason, detail),
    onSuccess: () => toast.success('Thread reported — our team will review it'),
    onError: (err) => toast.error(errorMessage(err)),
  })
}
