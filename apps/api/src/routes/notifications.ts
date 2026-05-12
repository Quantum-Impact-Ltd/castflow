import { Hono } from 'hono'
import { z } from 'zod'
import { authenticate } from '../middleware/authenticate'
import { NotificationService } from '../services/NotificationService'
import { AppError } from '../errors'

type AppEnv = { Variables: { user: { id: string; role: string } } }

export const notificationRoutes = new Hono<AppEnv>()

notificationRoutes.use('*', authenticate)

const markReadSchema = z.object({ ids: z.array(z.string().uuid()).min(1) })

notificationRoutes.get('/', async (c) => {
  const user = c.get('user')
  const unread = c.req.query('unread') === 'true'
  const limitParam = c.req.query('limit')
  const limit = limitParam ? Number(limitParam) : undefined
  const opts: { unreadOnly?: boolean; limit?: number } = {}
  if (unread) opts.unreadOnly = true
  if (Number.isFinite(limit)) opts.limit = limit as number
  const items = await NotificationService.listForUser(user.id, opts)
  return c.json({ success: true, data: items })
})

notificationRoutes.post('/read', async (c) => {
  const user = c.get('user')
  const parsed = markReadSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid input',
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    )
  }
  const result = await NotificationService.markRead(user.id, parsed.data.ids)
  return c.json({ success: true, data: { updated: result.count } })
})

notificationRoutes.post('/read-all', async (c) => {
  const user = c.get('user')
  const result = await NotificationService.markAllRead(user.id)
  return c.json({ success: true, data: { updated: result.count } })
})

notificationRoutes.delete('/:id', async (c) => {
  const user = c.get('user')
  const result = await NotificationService.deleteOne(user.id, c.req.param('id') ?? '')
  return c.json({ success: true, data: result })
})
