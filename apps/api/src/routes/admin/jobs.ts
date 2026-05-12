import { Hono } from 'hono'
import { z } from 'zod'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/requireRole'
import { prisma } from '../../lib/prisma'
import { parsePagination, paginate } from '../../lib/pagination'
import { JobService } from '../../services/JobService'
import { AppError } from '../../errors'

const removeJobBodySchema = z.object({ reason: z.string().min(5).max(1000) })

type AppEnv = { Variables: { user: { id: string; role: string } } }

export const adminJobRoutes = new Hono<AppEnv>()
adminJobRoutes.use('*', authenticate, requireRole('admin'))

adminJobRoutes.get('/', async (c) => {
  const status = c.req.query('status')
  const { cursor, limit } = parsePagination(c)
  const rows = await prisma.job.findMany({
    ...(status ? { where: { status: status as never } } : {}),
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      caster: { select: { companyName: true } },
      _count: { select: { bids: true } },
    },
  })
  const { items, nextCursor } = paginate(rows, limit)
  return c.json({ success: true, data: items, meta: { nextCursor } })
})

adminJobRoutes.get('/:id', async (c) => {
  const job = await prisma.job.findUnique({
    where: { id: c.req.param('id') ?? '' },
    include: {
      caster: true,
      bids: { include: { artist: true } },
      bookings: true,
    },
  })
  if (!job) throw new AppError('NOT_FOUND', 'Job not found', 404)
  return c.json({ success: true, data: job })
})

/**
 * Admin force-remove (PRD §6.5): cancels the job, expires open bids, and
 * refunds any held escrows. Records an AdminLog entry.
 */
adminJobRoutes.post('/:id/remove', async (c) => {
  const admin = c.get('user')
  const parsed = removeJobBodySchema.safeParse(await c.req.json())
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid input',
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    )
  }
  const jobId = c.req.param('id') ?? ''
  const job = await JobService.adminRemove(jobId, parsed.data.reason)
  await prisma.adminLog.create({
    data: {
      adminId: admin.id,
      action: 'remove_job',
      entityType: 'job',
      entityId: jobId,
      notes: parsed.data.reason,
    },
  })
  return c.json({ success: true, data: job })
})
