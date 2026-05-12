import { Hono } from 'hono'
import { submitReviewSchema } from '@castflow/validators'
import { authenticate } from '../middleware/authenticate'
import { ReviewService } from '../services/ReviewService'
import { AppError } from '../errors'

type AppEnv = { Variables: { user: { id: string; role: 'admin' | 'caster' | 'artist' } } }

export const reviewRoutes = new Hono<AppEnv>()

reviewRoutes.post('/bookings/:bookingId', authenticate, async (c) => {
  const user = c.get('user')
  const parsed = submitReviewSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid input',
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    )
  }
  const review = await ReviewService.submit(user, c.req.param('bookingId') ?? '', parsed.data)
  return c.json({ success: true, data: review })
})

reviewRoutes.get('/bookings/:bookingId', authenticate, async (c) => {
  const user = c.get('user')
  const reviews = await ReviewService.listForBooking(user, c.req.param('bookingId') ?? '')
  return c.json({ success: true, data: reviews })
})

reviewRoutes.get('/artists/:profileId', async (c) => {
  const reviews = await ReviewService.listForArtist(c.req.param('profileId') ?? '')
  return c.json({ success: true, data: reviews })
})
