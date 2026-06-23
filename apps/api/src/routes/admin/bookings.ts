import { Hono } from 'hono'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/requireRole'
import { prisma } from '../../lib/prisma'
import { parsePagination, paginate } from '../../lib/pagination'
import { AppError } from '../../errors'

type AppEnv = { Variables: { user: { id: string; role: string } } }

export const adminBookingRoutes = new Hono<AppEnv>()
adminBookingRoutes.use('*', authenticate, requireRole('admin'))

adminBookingRoutes.get('/', async (c) => {
  const status = c.req.query('status')
  const { cursor, limit } = parsePagination(c)
  const rows = await prisma.booking.findMany({
    ...(status ? { where: { status: status as never } } : {}),
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      job: { select: { title: true } },
      artist: { select: { firstName: true, lastName: true } },
      caster: { select: { companyName: true } },
    },
  })
  const { items, nextCursor } = paginate(rows, limit)
  return c.json({ success: true, data: items, meta: { nextCursor } })
})

adminBookingRoutes.get('/:id', async (c) => {
  const booking = await prisma.booking.findUnique({
    where: { id: c.req.param('id') ?? '' },
    include: {
      job: true,
      artist: true,
      caster: true,
      contract: true,
      dispute: true,
    },
  })
  if (!booking) throw new AppError('NOT_FOUND', 'Booking not found', 404)
  return c.json({ success: true, data: booking })
})
