import type { Message, MessageThread } from '@castflow/types'
import { fetcher } from '@/lib/fetcher'
import type { Init } from './types'

export interface ThreadSummary extends MessageThread {
  job?: { id: string; title: string }
  counterparty?: { displayName: string }
  unreadCount?: number
  lastMessagePreview?: string | null
  /** True when the thread contains any flagged message (auto-flag or report). */
  hasFlaggedContent?: boolean
}

export function listThreads(init?: Init) {
  return fetcher<ThreadSummary[]>('/messages/threads', init)
}

export function listMessages(
  threadId: string,
  filters: { cursor?: string; limit?: number } = {},
  init?: Init
) {
  return fetcher<Message[]>(`/messages/threads/${threadId}`, { params: filters, ...init })
}

export function sendMessage(threadId: string, content: string) {
  return fetcher<Message>(`/messages/threads/${threadId}`, {
    method: 'POST',
    body: { content },
  })
}

export function markThreadRead(threadId: string) {
  return fetcher<{ ok: true }>(`/messages/threads/${threadId}/read`, { method: 'POST' })
}

export type ReportThreadReason = 'harassment' | 'off_platform' | 'spam' | 'other'

export function reportThread(threadId: string, reason: ReportThreadReason, detail?: string) {
  return fetcher<{ ok: true }>(`/messages/threads/${threadId}/report`, {
    method: 'POST',
    body: { reason, ...(detail ? { detail } : {}) },
  })
}
