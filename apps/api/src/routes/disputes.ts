import { Hono } from 'hono'
import {
  raiseDisputeSchema,
  submitDisputeSideSchema,
  resolveDisputeSchema,
} from '@castflow/validators'
import { authenticate } from '../middleware/authenticate'
import { requireRole } from '../middleware/requireRole'
import { DisputeService } from '../services/DisputeService'
import { AppError } from '../errors'

type AppEnv = { Variables: { user: { id: string; role: 'admin' | 'caster' | 'artist' } } }

export const disputeRoutes = new Hono<AppEnv>()

disputeRoutes.use('*', authenticate)

function fields(err: { flatten: () => { fieldErrors: Record<string, string[]> } }) {
  return err.flatten().fieldErrors
}

disputeRoutes.post('/bookings/:bookingId', async (c) => {
  const user = c.get('user')
  const parsed = raiseDisputeSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, fields(parsed.error))
  }
  const dispute = await DisputeService.raise(user, c.req.param('bookingId') ?? '', parsed.data)
  return c.json({ success: true, data: dispute })
})

disputeRoutes.post('/bookings/:bookingId/evidence', async (c) => {
  const user = c.get('user')
  const parsed = submitDisputeSideSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, fields(parsed.error))
  }
  const dispute = await DisputeService.submitEvidence(
    user,
    c.req.param('bookingId') ?? '',
    parsed.data
  )
  return c.json({ success: true, data: dispute })
})

disputeRoutes.get('/bookings/:bookingId', async (c) => {
  const user = c.get('user')
  const dispute = await DisputeService.get(user, c.req.param('bookingId') ?? '')
  return c.json({ success: true, data: dispute })
})

disputeRoutes.post('/bookings/:bookingId/resolve', requireRole('admin'), async (c) => {
  const user = c.get('user')
  const parsed = resolveDisputeSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, fields(parsed.error))
  }
  const dispute = await DisputeService.adminResolve(
    user,
    c.req.param('bookingId') ?? '',
    parsed.data
  )
  return c.json({ success: true, data: dispute })
})
