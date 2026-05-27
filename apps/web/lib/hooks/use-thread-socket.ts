'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Message } from '@castflow/types'
import { queryKeys } from '@/lib/query-keys'

/**
 * Opens a Hono WebSocket for a message thread and appends inbound messages to
 * the TanStack Query cache in real time. The cookie session rides the
 * handshake (same-origin credentials). Degrades gracefully: if NEXT_PUBLIC_WS_URL
 * is unset or the socket errors, messaging still works via the REST
 * send/invalidate path in use-messages — this just makes delivery live.
 *
 * Only thread participants (artist/caster) should mount this; admins moderate
 * read-only over REST.
 */
export function useThreadSocket(threadId: string | undefined) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!threadId) return
    const base = process.env['NEXT_PUBLIC_WS_URL']
    if (!base) return

    let ws: WebSocket
    try {
      ws = new WebSocket(`${base}/ws/messages/${threadId}`)
    } catch {
      return
    }

    ws.onmessage = (event: MessageEvent<string>) => {
      let msg: Message
      try {
        msg = JSON.parse(event.data) as Message
      } catch {
        return
      }
      if (!msg || typeof msg !== 'object' || typeof msg.id !== 'string') return

      qc.setQueryData<Message[]>(queryKeys.messages.forThread(threadId), (old) => {
        const list = old ?? []
        if (list.some((m) => m.id === msg.id)) return list
        return [...list, msg]
      })
      void qc.invalidateQueries({ queryKey: queryKeys.threads.inbox() })
    }

    return () => {
      ws.close()
    }
  }, [threadId, qc])
}
