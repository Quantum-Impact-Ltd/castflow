import { Hono } from 'hono'
import { z } from 'zod'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/requireRole'
import { ArtistService } from '../../services/ArtistService'
import { AppError } from '../../errors'

type AppEnv = { Variables: { user: { id: string; role: string } } }

const approveSchema = z.object({ notes: z.string().max(1000).optional() })
const rejectSchema = z.object({ reason: z.string().min(5).max(1000) })

const statusFilter = z.enum(['pending', 'approved', 'rejected']).optional()

export const adminApplicationRoutes = new Hono<AppEnv>()

adminApplicationRoutes.use('*', authenticate, requireRole('admin'))

adminApplicationRoutes.get('/', async (c) => {
  const parsedStatus = statusFilter.safeParse(c.req.query('status'))
  const cursor = c.req.query('cursor') ?? undefined
  const limitParam = c.req.query('limit')
  const limit = limitParam ? Number(limitParam) : undefined

  const listArgs: {
    status?: 'pending' | 'approved' | 'rejected'
    cursor?: string
    limit?: number
  } = {}
  if (parsedStatus.success && parsedStatus.data) listArgs.status = parsedStatus.data
  if (cursor) listArgs.cursor = cursor
  if (Number.isFinite(limit)) listArgs.limit = limit as number

  const list = await ArtistService.listApplications(listArgs)

  return c.json({
    success: true,
    data: list.items,
    meta: { nextCursor: list.nextCursor },
  })
})

adminApplicationRoutes.post('/:id/approve', async (c) => {
  const admin = c.get('user')
  const parsed = approveSchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid input',
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    )
  }
  const result = await ArtistService.approveApplication({
    profileId: c.req.param('id'),
    adminId: admin.id,
    ...(parsed.data.notes ? { notes: parsed.data.notes } : {}),
  })
  return c.json({ success: true, data: result })
})

adminApplicationRoutes.post('/:id/reject', async (c) => {
  const admin = c.get('user')
  const parsed = rejectSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid input',
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    )
  }
  const result = await ArtistService.rejectApplication({
    profileId: c.req.param('id'),
    adminId: admin.id,
    reason: parsed.data.reason,
  })
  return c.json({ success: true, data: result })
})
