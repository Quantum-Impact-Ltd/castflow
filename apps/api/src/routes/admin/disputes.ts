import { Hono } from 'hono'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/requireRole'
import { prisma } from '../../lib/prisma'
import { parsePagination, paginate } from '../../lib/pagination'

type AppEnv = { Variables: { user: { id: string; role: string } } }

export const adminDisputeRoutes = new Hono<AppEnv>()
adminDisputeRoutes.use('*', authenticate, requireRole('admin'))

adminDisputeRoutes.get('/', async (c) => {
  const status = c.req.query('status')
  const { cursor, limit } = parsePagination(c)
  const rows = await prisma.dispute.findMany({
    ...(status ? { where: { status: status as never } } : {}),
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      booking: {
        select: {
          job: { select: { title: true } },
          artist: { select: { firstName: true, lastName: true } },
          caster: { select: { companyName: true } },
        },
      },
    },
  })
  const { items, nextCursor } = paginate(rows, limit)
  return c.json({ success: true, data: items, meta: { nextCursor } })
})
