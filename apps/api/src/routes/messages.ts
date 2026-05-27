import { Hono } from 'hono'
import { z } from 'zod'
import { authenticate } from '../middleware/authenticate'
import { rateLimitByUser } from '../middleware/rateLimit'
import { MessageService } from '../services/MessageService'
import { AppError } from '../errors'

type AppEnv = { Variables: { user: { id: string; role: 'admin' | 'caster' | 'artist' } } }

export const messageRoutes = new Hono<AppEnv>()

messageRoutes.use('*', authenticate)

const sendSchema = z.object({ content: z.string().min(1).max(2000) })

// 30 messages / minute / user — chat-burst tolerant, blocks runaway scripts.
const sendMessageLimit = rateLimitByUser({
  scope: 'messages:send',
  windowMs: 60 * 1000,
  max: 30,
  message: 'You are sending messages too quickly. Slow down.',
})

messageRoutes.get('/threads', async (c) => {
  const user = c.get('user')
  const threads = await MessageService.listInbox(user)
  return c.json({ success: true, data: threads })
})

messageRoutes.get('/threads/:id', async (c) => {
  const user = c.get('user')
  const messages = await MessageService.listMessages(user, c.req.param('id') ?? '')
  return c.json({ success: true, data: messages })
})

messageRoutes.post('/threads/:id', sendMessageLimit, async (c) => {
  const user = c.get('user')
  const parsed = sendSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid input',
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    )
  }
  const message = await MessageService.sendMessage(
    user,
    c.req.param('id') ?? '',
    parsed.data.content
  )
  return c.json({ success: true, data: message })
})

messageRoutes.post('/threads/:id/read', async (c) => {
  const user = c.get('user')
  const result = await MessageService.markRead(user, c.req.param('id') ?? '')
  return c.json({ success: true, data: { updated: result.count } })
})

const reportSchema = z.object({
  reason: z.enum(['harassment', 'off_platform', 'spam', 'other']),
  detail: z.string().max(500).optional(),
})

messageRoutes.post('/threads/:id/report', async (c) => {
  const user = c.get('user')
  const parsed = reportSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid input',
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    )
  }
  const result = await MessageService.reportThread(
    user,
    c.req.param('id') ?? '',
    parsed.data.reason,
    parsed.data.detail
  )
  return c.json({ success: true, data: result })
})
