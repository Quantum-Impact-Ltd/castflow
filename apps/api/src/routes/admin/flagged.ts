import { Hono } from 'hono'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/requireRole'
import { prisma } from '../../lib/prisma'
import { parsePagination, paginate } from '../../lib/pagination'

type AppEnv = { Variables: { user: { id: string; role: string } } }

export const adminFlaggedRoutes = new Hono<AppEnv>()
adminFlaggedRoutes.use('*', authenticate, requireRole('admin'))

adminFlaggedRoutes.get('/messages', async (c) => {
  const { cursor, limit } = parsePagination(c)
  const rows = await prisma.message.findMany({
    where: { isFlagged: true },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { thread: { select: { jobId: true, casterId: true, artistId: true } } },
  })
  const { items, nextCursor } = paginate(rows, limit)
  return c.json({ success: true, data: items, meta: { nextCursor } })
})

adminFlaggedRoutes.get('/reviews', async (c) => {
  const { cursor, limit } = parsePagination(c)
  const rows = await prisma.review.findMany({
    where: { isFlagged: true, isRemoved: false },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })
  const { items, nextCursor } = paginate(rows, limit)
  return c.json({ success: true, data: items, meta: { nextCursor } })
})
