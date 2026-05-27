import type { WSContext } from 'hono/ws'

/**
 * In-memory registry of live message-thread WebSocket connections, keyed by
 * threadId. A thread can have multiple sockets (the caster + the artist, each
 * possibly across tabs). When a message is persisted via the REST endpoint,
 * `MessageService.sendMessage` calls `broadcastToThread` to push it live to
 * everyone connected to that thread.
 *
 * MVP / single-instance only — same caveat as the in-memory rate limiter. Once
 * the API runs on more than one replica this needs a shared pub/sub (Redis,
 * Upstash) so a message persisted on instance A reaches a socket on instance B.
 */
const rooms = new Map<string, Set<WSContext>>()

export function joinThread(threadId: string, ws: WSContext): void {
  let set = rooms.get(threadId)
  if (!set) {
    set = new Set()
    rooms.set(threadId, set)
  }
  set.add(ws)
}

export function leaveThread(threadId: string, ws: WSContext): void {
  const set = rooms.get(threadId)
  if (!set) return
  set.delete(ws)
  if (set.size === 0) rooms.delete(threadId)
}

/** Push a JSON-serialisable payload to every socket on a thread. */
export function broadcastToThread(threadId: string, payload: unknown): void {
  const set = rooms.get(threadId)
  if (!set || set.size === 0) return
  const data = JSON.stringify(payload)
  for (const ws of set) {
    try {
      ws.send(data)
    } catch {
      // Dead socket — drop it. onClose normally handles removal; this is a
      // belt-and-braces guard so one broken socket can't abort the fan-out.
      set.delete(ws)
    }
  }
}
