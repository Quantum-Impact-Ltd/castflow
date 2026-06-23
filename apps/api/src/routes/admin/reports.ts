import { Hono } from 'hono'
import type { Context } from 'hono'
import { z } from 'zod'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/requireRole'
import { prisma } from '../../lib/prisma'
import { parsePagination, paginate } from '../../lib/pagination'
import { AppError } from '../../errors'

type AppEnv = { Variables: { user: { id: string; role: string } } }

export const adminReportRoutes = new Hono<AppEnv>()
adminReportRoutes.use('*', authenticate, requireRole('admin'))

const actionSchema = z.object({ note: z.string().max(1000).optional() })
const STATUSES = ['open', 'reviewing', 'resolved', 'dismissed'] as const
type ReportStatus = (typeof STATUSES)[number]

async function namesByUserId(ids: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids)].filter(Boolean)
  if (unique.length === 0) return {}
  const users = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, name: true },
  })
  return Object.fromEntries(users.map((u) => [u.id, u.name]))
}

/** Queue of all user-submitted content reports, newest first, filterable by status. */
adminReportRoutes.get('/', async (c) => {
  const { cursor, limit } = parsePagination(c)
  const statusParam = c.req.query('status')
  const where =
    statusParam && STATUSES.includes(statusParam as ReportStatus)
      ? { status: statusParam as ReportStatus }
      : {}

  const rows = await prisma.contentReport.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const reporterNames = await namesByUserId(rows.map((r) => r.reporterId))

  // Resolve a human label for each target (job title for threads, reviewee for reviews).
  const threadIds = rows.filter((r) => r.targetType === 'message_thread').map((r) => r.targetId)
  const reviewIds = rows.filter((r) => r.targetType === 'review').map((r) => r.targetId)
  const [threads, reviews] = await Promise.all([
    threadIds.length
      ? prisma.messageThread.findMany({
          where: { id: { in: threadIds } },
          select: { id: true, job: { select: { title: true } } },
        })
      : Promise.resolve([]),
    reviewIds.length
      ? prisma.review.findMany({
          where: { id: { in: reviewIds } },
          select: {
            id: true,
            artistReviewee: { select: { firstName: true, lastName: true } },
            casterReviewee: { select: { companyName: true } },
          },
        })
      : Promise.resolve([]),
  ])
  const threadLabel = new Map(threads.map((t) => [t.id, t.job?.title ?? 'Conversation']))
  const reviewLabel = new Map(
    reviews.map((r) => [
      r.id,
      r.artistReviewee
        ? `Review of ${r.artistReviewee.firstName} ${r.artistReviewee.lastName}`
        : r.casterReviewee
          ? `Review of ${r.casterReviewee.companyName}`
          : 'Review',
    ])
  )

  const enriched = rows.map((r) => ({
    ...r,
    reporterName: reporterNames[r.reporterId] ?? null,
    targetLabel:
      r.targetType === 'message_thread'
        ? (threadLabel.get(r.targetId) ?? 'Conversation')
        : (reviewLabel.get(r.targetId) ?? 'Review'),
  }))

  const { items, nextCursor } = paginate(enriched, limit)
  return c.json({ success: true, data: items, meta: { nextCursor } })
})

async function setStatus(c: Context<AppEnv>, status: ReportStatus) {
  const admin = c.get('user')
  const id = c.req.param('id') ?? ''
  const existing = await prisma.contentReport.findUnique({ where: { id } })
  if (!existing) throw new AppError('NOT_FOUND', 'Report not found', 404)
  const parsed = actionSchema.safeParse(await c.req.json().catch(() => ({})))
  const note = parsed.success ? (parsed.data.note ?? null) : null

  const updated = await prisma.contentReport.update({
    where: { id },
    data: { status, reviewedById: admin.id, reviewedAt: new Date(), resolutionNote: note },
  })
  await prisma.adminLog.create({
    data: {
      adminId: admin.id,
      action: `report_${status}`,
      entityType: 'content_report',
      entityId: id,
      notes: note,
    },
  })
  return c.json({ success: true, data: updated })
}

adminReportRoutes.post('/:id/resolve', (c) => setStatus(c, 'resolved'))
adminReportRoutes.post('/:id/dismiss', (c) => setStatus(c, 'dismissed'))
