import { Hono } from 'hono'
import { z } from 'zod'
import { authenticate } from '../middleware/authenticate'
import { BookingService } from '../services/BookingService'
import { AppError } from '../errors'

type AppEnv = { Variables: { user: { id: string; role: 'admin' | 'caster' | 'artist' } } }

export const bookingRoutes = new Hono<AppEnv>()

bookingRoutes.use('*', authenticate)

const cancelBodySchema = z.object({ reason: z.string().min(3).max(500) })

bookingRoutes.get('/me/list', async (c) => {
  const user = c.get('user')
  const cursor = c.req.query('cursor')
  const limit = c.req.query('limit') ? Number(c.req.query('limit')) : undefined
  const { items, nextCursor } = await BookingService.getMyBookings(user, {
    ...(cursor ? { cursor } : {}),
    ...(limit !== undefined ? { limit } : {}),
  })
  return c.json({ success: true, data: items, meta: { nextCursor } })
})

bookingRoutes.get('/:id', async (c) => {
  const user = c.get('user')
  const booking = await BookingService.getById(user, c.req.param('id') ?? '')
  return c.json({ success: true, data: booking })
})

bookingRoutes.post('/:id/confirm-completion', async (c) => {
  const user = c.get('user')
  const booking = await BookingService.confirmCompletion(user, c.req.param('id') ?? '')
  return c.json({ success: true, data: booking })
})

bookingRoutes.post('/:id/cancel', async (c) => {
  const user = c.get('user')
  const parsed = cancelBodySchema.safeParse(await c.req.json())
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid input',
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    )
  }
  const booking = await BookingService.cancel(user, c.req.param('id') ?? '', parsed.data.reason)
  return c.json({ success: true, data: booking })
})
