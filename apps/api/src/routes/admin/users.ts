import { Hono } from 'hono'
import { z } from 'zod'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/requireRole'
import { prisma } from '../../lib/prisma'
import { parsePagination, paginate } from '../../lib/pagination'
import { AppError } from '../../errors'

type AppEnv = { Variables: { user: { id: string; role: string } } }

const statusActionSchema = z.object({
  status: z.enum(['active', 'suspended', 'banned']),
  notes: z.string().max(1000).optional(),
})

export const adminUserRoutes = new Hono<AppEnv>()
adminUserRoutes.use('*', authenticate, requireRole('admin'))

adminUserRoutes.get('/', async (c) => {
  const role = c.req.query('role')
  const status = c.req.query('status')
  const search = c.req.query('search')
  const where = {
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }
  const { cursor, limit } = parsePagination(c)
  const rows = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      approvalStatus: true,
      emailVerified: true,
      createdAt: true,
    },
  })
  const { items, nextCursor } = paginate(rows, limit)
  return c.json({ success: true, data: items, meta: { nextCursor } })
})

adminUserRoutes.get('/:id', async (c) => {
  const user = await prisma.user.findUnique({
    where: { id: c.req.param('id') ?? '' },
    include: { artistProfile: true, casterProfile: true },
  })
  if (!user) throw new AppError('NOT_FOUND', 'User not found', 404)
  return c.json({ success: true, data: user })
})

adminUserRoutes.post('/:id/status', async (c) => {
  const admin = c.get('user')
  const parsed = statusActionSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid input',
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    )
  }
  const id = c.req.param('id') ?? ''
  const newStatus = parsed.data.status
  const revoke = newStatus === 'suspended' || newStatus === 'banned'
  const ops = [
    prisma.user.update({ where: { id }, data: { status: newStatus } }),
    prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: `set_status_${newStatus}`,
        entityType: 'user',
        entityId: id,
        notes: parsed.data.notes ?? null,
      },
    }),
    ...(revoke ? [prisma.session.deleteMany({ where: { userId: id } })] : []),
  ]
  const [updated] = await prisma.$transaction(ops)
  return c.json({ success: true, data: updated })
})
