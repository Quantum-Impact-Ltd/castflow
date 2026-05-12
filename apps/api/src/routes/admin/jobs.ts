import { Hono } from 'hono'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/requireRole'
import { prisma } from '../../lib/prisma'
import { parsePagination, paginate } from '../../lib/pagination'
import { AppError } from '../../errors'

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
