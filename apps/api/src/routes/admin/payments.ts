import { Hono } from 'hono'
import { z } from 'zod'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/requireRole'
import { prisma } from '../../lib/prisma'
import { parsePagination, paginate } from '../../lib/pagination'
import { PaymentService } from '../../services/PaymentService'
import { AppError } from '../../errors'

type AppEnv = { Variables: { user: { id: string; role: string } } }

export const adminPaymentRoutes = new Hono<AppEnv>()
adminPaymentRoutes.use('*', authenticate, requireRole('admin'))

const actionBodySchema = z.object({ notes: z.string().min(3).max(1000) })

adminPaymentRoutes.get('/', async (c) => {
  const escrowStatus = c.req.query('escrowStatus')
  const { cursor, limit } = parsePagination(c)
  const rows = await prisma.payment.findMany({
    ...(escrowStatus ? { where: { escrowStatus: escrowStatus as never } } : {}),
    orderBy: { createdAt: 'desc' },
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

/**
 * Admin force-release: pushes a held escrow to the artist regardless of
 * caster confirmation. Same money flow as PaymentService.releaseEscrow with
 * `actor: 'admin'`, gated on the artist's Connect-ready state. Records an
 * AdminLog entry.
 */
adminPaymentRoutes.post('/bookings/:bookingId/release', async (c) => {
  const admin = c.get('user')
  const parsed = actionBodySchema.safeParse(await c.req.json())
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid input',
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    )
  }
  const bookingId = c.req.param('bookingId') ?? ''
  const payment = await PaymentService.releaseEscrow(bookingId, { actor: 'admin' })
  await prisma.adminLog.create({
    data: {
      adminId: admin.id,
      action: 'force_release_escrow',
      entityType: 'booking',
      entityId: bookingId,
      notes: parsed.data.notes,
    },
  })
  return c.json({ success: true, data: payment })
})

/**
 * Admin force-refund: cancels the held escrow and returns the auth to the
 * caster. Records an AdminLog entry.
 */
adminPaymentRoutes.post('/bookings/:bookingId/refund', async (c) => {
  const admin = c.get('user')
  const parsed = actionBodySchema.safeParse(await c.req.json())
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid input',
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    )
  }
  const bookingId = c.req.param('bookingId') ?? ''
  const payment = await PaymentService.refundEscrow(bookingId, parsed.data.notes)
  await prisma.adminLog.create({
    data: {
      adminId: admin.id,
      action: 'force_refund_escrow',
      entityType: 'booking',
      entityId: bookingId,
      notes: parsed.data.notes,
    },
  })
  return c.json({ success: true, data: payment })
})
