import { Hono } from 'hono'
import {
  presignedUrlSchema,
  confirmUploadSchema,
  updatePortfolioItemSchema,
} from '@castflow/validators'
import { authenticate } from '../middleware/authenticate'
import { rateLimitByUser } from '../middleware/rateLimit'
import { UploadService } from '../services/UploadService'
import { AppError } from '../errors'

type AppEnv = { Variables: { user: { id: string; role: string } } }

export const uploadRoutes = new Hono<AppEnv>()

uploadRoutes.use('*', authenticate)

// 30 presigned URLs / 10 min per user — generous for portfolio batches, blocks spam.
const presignLimit = rateLimitByUser({
  scope: 'uploads:presign',
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: 'Too many upload requests. Try again in a few minutes.',
})

uploadRoutes.post('/presigned-url', presignLimit, async (c) => {
  const user = c.get('user')
  const parsed = presignedUrlSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid input',
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    )
  }
  const result = await UploadService.getPresignedUrl(user.id, parsed.data)
  return c.json({ success: true, data: result })
})

uploadRoutes.post('/confirm', async (c) => {
  const user = c.get('user')
  const parsed = confirmUploadSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid input',
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    )
  }
  const result = await UploadService.confirmUpload(user.id, parsed.data)
  return c.json({ success: true, data: result })
})

uploadRoutes.delete('/portfolio/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  if (!id) throw new AppError('VALIDATION_ERROR', 'Missing portfolio item id', 400)
  const result = await UploadService.deletePortfolioItem(user.id, id)
  return c.json({ success: true, data: result })
})

uploadRoutes.patch('/portfolio/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  if (!id) throw new AppError('VALIDATION_ERROR', 'Missing portfolio item id', 400)
  const parsed = updatePortfolioItemSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid input',
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    )
  }
  const result = await UploadService.updatePortfolioItem(user.id, id, parsed.data)
  return c.json({ success: true, data: result })
})

uploadRoutes.patch('/portfolio/:id/primary', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')
  if (!id) throw new AppError('VALIDATION_ERROR', 'Missing portfolio item id', 400)
  const result = await UploadService.setPrimaryPortfolioItem(user.id, id)
  return c.json({ success: true, data: result })
})
