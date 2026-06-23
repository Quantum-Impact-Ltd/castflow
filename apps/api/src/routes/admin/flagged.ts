import { Hono } from 'hono'
import { z } from 'zod'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/requireRole'
import { prisma } from '../../lib/prisma'
import { parsePagination, paginate } from '../../lib/pagination'
import { AppError } from '../../errors'

type AppEnv = { Variables: { user: { id: string; role: string } } }

export const adminFlaggedRoutes = new Hono<AppEnv>()
adminFlaggedRoutes.use('*', authenticate, requireRole('admin'))

const actionBodySchema = z.object({ notes: z.string().max(1000).optional() })

/** Resolve a set of user ids → display names in one query. */
async function namesByUserId(ids: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids)].filter(Boolean)
  if (unique.length === 0) return {}
  const users = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, name: true },
  })
  return Object.fromEntries(users.map((u) => [u.id, u.name]))
}

adminFlaggedRoutes.get('/messages', async (c) => {
  const { cursor, limit } = parsePagination(c)
  const rows = await prisma.message.findMany({
    where: { isFlagged: true },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      thread: { select: { jobId: true, casterId: true, artistId: true } },
    },
  })
  const senderNames = await namesByUserId(rows.map((m) => m.senderId))
  const enriched = rows.map((m) => ({ ...m, senderName: senderNames[m.senderId] ?? null }))
  const { items, nextCursor } = paginate(enriched, limit)
  return c.json({ success: true, data: items, meta: { nextCursor } })
})

/**
 * Full investigation context for a flagged message: the surrounding
 * conversation, both participants (with userIds for deep-linking to the Users
 * page), the job, and which party authored the flagged content. Admins can read
 * any thread (the participant/unlocked checks don't apply to them). This powers
 * the moderation detail view so admins don't have to act blind on a single line.
 */
adminFlaggedRoutes.get('/messages/:id/context', async (c) => {
  const id = c.req.param('id') ?? ''
  const message = await prisma.message.findUnique({
    where: { id },
    include: { thread: true },
  })
  if (!message) throw new AppError('NOT_FOUND', 'Message not found', 404)
  const thread = message.thread

  const [caster, artist, job, messages, reportRows] = await Promise.all([
    prisma.casterProfile.findUnique({
      where: { id: thread.casterId },
      select: { id: true, userId: true, companyName: true },
    }),
    prisma.artistProfile.findUnique({
      where: { id: thread.artistId },
      select: { id: true, userId: true, firstName: true, lastName: true },
    }),
    prisma.job.findUnique({ where: { id: thread.jobId }, select: { id: true, title: true } }),
    prisma.message.findMany({ where: { threadId: thread.id }, orderBy: { createdAt: 'asc' } }),
    prisma.contentReport.findMany({
      where: { targetType: 'message_thread', targetId: thread.id },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const roleByUser = new Map<string, { role: 'caster' | 'artist'; name: string }>()
  if (caster?.userId) roleByUser.set(caster.userId, { role: 'caster', name: caster.companyName })
  if (artist?.userId) {
    roleByUser.set(artist.userId, {
      role: 'artist',
      name: `${artist.firstName} ${artist.lastName}`,
    })
  }

  // Resolve reporter identity for the persisted reports. A reporter is a thread
  // participant, so we can usually name them via the role map; fall back to the
  // User table for anything unexpected.
  const reporterNames = await namesByUserId(reportRows.map((r) => r.reporterId))
  const reports = reportRows.map((r) => {
    const meta = roleByUser.get(r.reporterId)
    return {
      id: r.id,
      reason: r.reason,
      detail: r.detail,
      status: r.status,
      createdAt: r.createdAt,
      reporterUserId: r.reporterId,
      reporterName: meta?.name ?? reporterNames[r.reporterId] ?? 'Unknown',
      reporterRole: meta?.role ?? ('unknown' as const),
    }
  })

  const conversation = messages.map((m) => {
    const meta = roleByUser.get(m.senderId)
    return {
      id: m.id,
      content: m.content,
      isFlagged: m.isFlagged,
      flagReason: m.flagReason,
      createdAt: m.createdAt,
      readAt: m.readAt,
      senderUserId: m.senderId,
      senderName: meta?.name ?? 'Unknown',
      senderRole: meta?.role ?? ('unknown' as const),
      isSubject: m.id === id,
    }
  })

  // The "reported party" is the participant who is NOT the reporter. Prefer the
  // persisted report's reporter role; fall back to inferring from who authored
  // the flagged messages (covers auto-flagged threads with no submitted report).
  const reporterRole = reports.find((r) => r.reporterRole !== 'unknown')?.reporterRole ?? null
  const flaggedRoles = new Set(
    messages.filter((m) => m.isFlagged).map((m) => roleByUser.get(m.senderId)?.role)
  )
  const reportedParty =
    reporterRole === 'caster'
      ? 'artist'
      : reporterRole === 'artist'
        ? 'caster'
        : flaggedRoles.has('caster') && !flaggedRoles.has('artist')
          ? 'caster'
          : flaggedRoles.has('artist') && !flaggedRoles.has('caster')
            ? 'artist'
            : null

  return c.json({
    success: true,
    data: {
      message: { ...message, thread: undefined },
      job,
      participants: {
        caster: caster
          ? { profileId: caster.id, userId: caster.userId, name: caster.companyName }
          : null,
        artist: artist
          ? {
              profileId: artist.id,
              userId: artist.userId,
              name: `${artist.firstName} ${artist.lastName}`,
            }
          : null,
      },
      conversation,
      reports,
      flaggedCount: messages.filter((m) => m.isFlagged).length,
      reportedParty,
    },
  })
})

adminFlaggedRoutes.get('/reviews', async (c) => {
  const { cursor, limit } = parsePagination(c)
  const rows = await prisma.review.findMany({
    where: { isFlagged: true, isRemoved: false },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      artistReviewee: { select: { firstName: true, lastName: true } },
      casterReviewee: { select: { companyName: true } },
    },
  })
  const reviewerNames = await namesByUserId(rows.map((r) => r.reviewerId))
  const enriched = rows.map((r) => ({
    ...r,
    reviewerName: reviewerNames[r.reviewerId] ?? null,
    revieweeName: r.artistReviewee
      ? `${r.artistReviewee.firstName} ${r.artistReviewee.lastName}`
      : (r.casterReviewee?.companyName ?? null),
  }))
  const { items, nextCursor } = paginate(enriched, limit)
  return c.json({ success: true, data: items, meta: { nextCursor } })
})

// ── Moderation actions ───────────────────────────────────────────────────────

async function parseNotes(c: { req: { json: () => Promise<unknown> } }) {
  const parsed = actionBodySchema.safeParse(await c.req.json().catch(() => ({})))
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid input',
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    )
  }
  return parsed.data.notes ?? null
}

/** Clear the flag on a message (dismiss the report; content stays). */
adminFlaggedRoutes.post('/messages/:id/clear', async (c) => {
  const admin = c.get('user')
  const id = c.req.param('id') ?? ''
  const existing = await prisma.message.findUnique({ where: { id } })
  if (!existing) throw new AppError('NOT_FOUND', 'Message not found', 404)
  const notes = await parseNotes(c)
  const [updated] = await prisma.$transaction([
    prisma.message.update({ where: { id }, data: { isFlagged: false } }),
    // Resolve any open report on this thread — clearing the flag is the outcome.
    prisma.contentReport.updateMany({
      where: {
        targetType: 'message_thread',
        targetId: existing.threadId,
        status: { in: ['open', 'reviewing'] },
      },
      data: {
        status: 'resolved',
        reviewedById: admin.id,
        reviewedAt: new Date(),
        resolutionNote: notes,
      },
    }),
    prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: 'clear_flag_message',
        entityType: 'message',
        entityId: id,
        notes,
      },
    }),
  ])
  return c.json({ success: true, data: updated })
})

/** Clear the flag on a review (dismiss the report; review stays visible). */
adminFlaggedRoutes.post('/reviews/:id/clear', async (c) => {
  const admin = c.get('user')
  const id = c.req.param('id') ?? ''
  const existing = await prisma.review.findUnique({ where: { id } })
  if (!existing) throw new AppError('NOT_FOUND', 'Review not found', 404)
  const notes = await parseNotes(c)
  const [updated] = await prisma.$transaction([
    prisma.review.update({ where: { id }, data: { isFlagged: false } }),
    prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: 'clear_flag_review',
        entityType: 'review',
        entityId: id,
        notes,
      },
    }),
  ])
  return c.json({ success: true, data: updated })
})

/** Remove a review from public view (soft delete; preserved for audit). */
adminFlaggedRoutes.post('/reviews/:id/remove', async (c) => {
  const admin = c.get('user')
  const id = c.req.param('id') ?? ''
  const existing = await prisma.review.findUnique({ where: { id } })
  if (!existing) throw new AppError('NOT_FOUND', 'Review not found', 404)
  const notes = await parseNotes(c)
  const [updated] = await prisma.$transaction([
    prisma.review.update({ where: { id }, data: { isRemoved: true, isFlagged: false } }),
    prisma.adminLog.create({
      data: {
        adminId: admin.id,
        action: 'remove_review',
        entityType: 'review',
        entityId: id,
        notes,
      },
    }),
  ])
  return c.json({ success: true, data: updated })
})
