import { Hono } from 'hono'
import { z } from 'zod'
import { authenticate } from '../middleware/authenticate'
import { ContractService } from '../services/ContractService'
import { AppError } from '../errors'

type AppEnv = { Variables: { user: { id: string; role: 'admin' | 'caster' | 'artist' } } }

export const contractRoutes = new Hono<AppEnv>()

contractRoutes.use('*', authenticate)

const signBodySchema = z.object({ signatureName: z.string().min(2).max(100) })

contractRoutes.get('/bookings/:bookingId', async (c) => {
  const user = c.get('user')
  const contract = await ContractService.getForBooking(user, c.req.param('bookingId') ?? '')
  return c.json({ success: true, data: contract })
})

// Short-lived presigned URL to view/download the signed contract PDF. The
// contracts bucket is private, so the stored s3:// pdfUrl is not openable
// directly — the client fetches this URL on demand.
contractRoutes.get('/bookings/:bookingId/pdf-url', async (c) => {
  const user = c.get('user')
  const result = await ContractService.getPdfDownloadUrl(user, c.req.param('bookingId') ?? '')
  return c.json({ success: true, data: result })
})

contractRoutes.post('/bookings/:bookingId/generate', async (c) => {
  const user = c.get('user')
  const contract = await ContractService.generateForBooking(user, c.req.param('bookingId') ?? '')
  return c.json({ success: true, data: contract })
})

contractRoutes.post('/bookings/:bookingId/sign', async (c) => {
  const user = c.get('user')
  const parsed = signBodySchema.safeParse(await c.req.json())
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid input',
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    )
  }
  const contract = await ContractService.sign(
    user,
    c.req.param('bookingId') ?? '',
    parsed.data.signatureName
  )
  return c.json({ success: true, data: contract })
})
