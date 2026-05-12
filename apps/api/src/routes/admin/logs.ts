import { Hono } from 'hono'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/requireRole'
import { prisma } from '../../lib/prisma'
import { parsePagination, paginate } from '../../lib/pagination'

type AppEnv = { Variables: { user: { id: string; role: string } } }

export const adminLogRoutes = new Hono<AppEnv>()
adminLogRoutes.use('*', authenticate, requireRole('admin'))

adminLogRoutes.get('/', async (c) => {
  const adminId = c.req.query('adminId')
  const entityType = c.req.query('entityType')
  const { cursor, limit } = parsePagination(c, 50)
  const rows = await prisma.adminLog.findMany({
    where: {
      ...(adminId ? { adminId } : {}),
      ...(entityType ? { entityType } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })
  const { items, nextCursor } = paginate(rows, limit)
  return c.json({ success: true, data: items, meta: { nextCursor } })
})
