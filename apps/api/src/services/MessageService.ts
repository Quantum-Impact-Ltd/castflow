import { prisma } from '../lib/prisma'
import { env } from '../lib/env'
import { AppError } from '../errors'
import { NotificationService } from './NotificationService'
import { broadcastToThread } from '../ws/registry'

interface UserCtx {
  id: string
  role: 'admin' | 'caster' | 'artist'
}

/**
 * Resolve the user to either their caster/artist profile id. The message thread
 * is keyed on (jobId, casterId, artistId) — both profile ids — so we need
 * the caller's profile id for authz.
 */
async function profileIdForUser(user: UserCtx): Promise<{
  casterProfileId?: string
  artistProfileId?: string
}> {
  if (user.role === 'caster') {
    const c = await prisma.casterProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!c) throw new AppError('NOT_FOUND', 'Caster profile not found', 404)
    return { casterProfileId: c.id }
  }
  if (user.role === 'artist') {
    const a = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!a) throw new AppError('NOT_FOUND', 'Artist profile not found', 404)
    return { artistProfileId: a.id }
  }
  return {}
}

/**
 * Cheap heuristic for off-platform contact attempts. Two patterns:
 *   - email: `local@domain.tld`
 *   - phone-ish: 9+ digits (with optional separators and a leading +)
 * False positives are acceptable — admin moderation queue handles the rest.
 */
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/i
const PHONE_RE = /(?:\+\d[\d\s().-]{7,}|\d[\d\s().-]{8,})/
function containsContactDetails(content: string): boolean {
  return EMAIL_RE.test(content) || PHONE_RE.test(content)
}

/**
 * Given a thread and the sender's user id, return the user id of the OTHER
 * participant — or null if we can't resolve (e.g. admin senders, which don't
 * happen in this MVP). Used to address message_received notifications.
 */
async function resolveRecipientUserId(
  thread: { casterId: string; artistId: string },
  senderUserId: string
): Promise<string | null> {
  const [caster, artist] = await Promise.all([
    prisma.casterProfile.findUnique({ where: { id: thread.casterId }, select: { userId: true } }),
    prisma.artistProfile.findUnique({ where: { id: thread.artistId }, select: { userId: true } }),
  ])
  if (caster?.userId === senderUserId) return artist?.userId ?? null
  if (artist?.userId === senderUserId) return caster?.userId ?? null
  return null
}

async function loadThreadForUser(threadId: string, user: UserCtx) {
  const thread = await prisma.messageThread.findUnique({ where: { id: threadId } })
  if (!thread) throw new AppError('NOT_FOUND', 'Thread not found', 404)
  if (user.role === 'admin') return thread

  const { casterProfileId, artistProfileId } = await profileIdForUser(user)
  const isCaster = casterProfileId && thread.casterId === casterProfileId
  const isArtist = artistProfileId && thread.artistId === artistProfileId
  if (!isCaster && !isArtist) throw new AppError('FORBIDDEN', 'Not a thread participant', 403)
  return thread
}

export class MessageService {
  protected static readonly db = prisma

  static async listInbox(user: UserCtx) {
    const { casterProfileId, artistProfileId } = await profileIdForUser(user)
    if (!casterProfileId && !artistProfileId) {
      throw new AppError('FORBIDDEN', 'Admins use admin routes', 403)
    }
    const where = casterProfileId
      ? { casterId: casterProfileId }
      : { artistId: artistProfileId as string }
    const threads = await prisma.messageThread.findMany({
      where,
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        job: { select: { id: true, title: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })
    if (threads.length === 0) return []

    // casterId/artistId are plain FK columns (no Prisma relation), so resolve
    // the counterparty's display name with a single batched lookup. The viewer
    // sees the OTHER party: a caster sees the artist's first name, an artist
    // sees the caster's company name (per the contact-privacy business rule).
    const counterpartyNames = new Map<string, string>()
    if (casterProfileId) {
      const artistIds = [...new Set(threads.map((t) => t.artistId))]
      const artists = await prisma.artistProfile.findMany({
        where: { id: { in: artistIds } },
        select: { id: true, firstName: true },
      })
      for (const a of artists) counterpartyNames.set(a.id, a.firstName)
    } else {
      const casterIds = [...new Set(threads.map((t) => t.casterId))]
      const casters = await prisma.casterProfile.findMany({
        where: { id: { in: casterIds } },
        select: { id: true, companyName: true },
      })
      for (const cp of casters) counterpartyNames.set(cp.id, cp.companyName)
    }

    // Unread = messages the viewer didn't send and hasn't read. senderId stores
    // User.id (see markRead), so compare against user.id, not the profile id.
    const unreadGroups = await prisma.message.groupBy({
      by: ['threadId'],
      where: {
        threadId: { in: threads.map((t) => t.id) },
        senderId: { not: user.id },
        readAt: null,
      },
      _count: { _all: true },
    })
    const unreadByThread = new Map(unreadGroups.map((g) => [g.threadId, g._count._all]))

    // Threads containing any flagged message (auto-flagged contact details or a
    // submitted report) so the inbox can surface an "under review" indicator.
    const flaggedGroups = await prisma.message.groupBy({
      by: ['threadId'],
      where: { threadId: { in: threads.map((t) => t.id) }, isFlagged: true },
      _count: { _all: true },
    })
    const flaggedThreads = new Set(flaggedGroups.map((g) => g.threadId))

    return threads.map((thread) => {
      const counterpartyId = casterProfileId ? thread.artistId : thread.casterId
      return {
        ...thread,
        counterparty: { displayName: counterpartyNames.get(counterpartyId) ?? 'Conversation' },
        lastMessagePreview: thread.messages[0]?.content ?? null,
        unreadCount: unreadByThread.get(thread.id) ?? 0,
        hasFlaggedContent: flaggedThreads.has(thread.id),
      }
    })
  }

  /**
   * Boolean authz check used by the WebSocket upgrade — same rule as
   * listMessages (participant or admin, AND the thread is unlocked) but
   * returns false instead of throwing.
   */
  static async canAccessThread(user: UserCtx, threadId: string): Promise<boolean> {
    const thread = await prisma.messageThread.findUnique({ where: { id: threadId } })
    if (!thread || !thread.unlocked) return false
    if (user.role === 'admin') return true
    const { casterProfileId, artistProfileId } = await profileIdForUser(user).catch(() => ({
      casterProfileId: undefined,
      artistProfileId: undefined,
    }))
    return Boolean(
      (casterProfileId && thread.casterId === casterProfileId) ||
      (artistProfileId && thread.artistId === artistProfileId)
    )
  }

  static async listMessages(user: UserCtx, threadId: string) {
    // Single round-trip: pull thread + messages together, then check authz.
    const { casterProfileId, artistProfileId } = await profileIdForUser(user)
    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })
    if (!thread) throw new AppError('NOT_FOUND', 'Thread not found', 404)
    if (user.role !== 'admin') {
      const isCaster = casterProfileId && thread.casterId === casterProfileId
      const isArtist = artistProfileId && thread.artistId === artistProfileId
      if (!isCaster && !isArtist) {
        throw new AppError('FORBIDDEN', 'Not a thread participant', 403)
      }
    }
    if (!thread.unlocked) {
      throw new AppError('THREAD_LOCKED', 'Thread is locked until you have been shortlisted', 403)
    }
    return thread.messages
  }

  static async sendMessage(user: UserCtx, threadId: string, content: string) {
    if (!content || content.trim().length === 0) {
      throw new AppError('VALIDATION_ERROR', 'Message cannot be empty', 400, {
        content: ['Required'],
      })
    }
    if (content.length > 2000) {
      throw new AppError('VALIDATION_ERROR', 'Message too long', 400, {
        content: ['Max 2000 characters'],
      })
    }

    const thread = await loadThreadForUser(threadId, user)
    if (!thread.unlocked) {
      throw new AppError('THREAD_LOCKED', 'You cannot message before being shortlisted', 403)
    }

    // Contact-detail redaction (PRD §10.10): flag messages that look like
    // they're trying to share phone numbers or emails so admin can review.
    // We DON'T block — that would risk false positives on prop/scene
    // descriptions. The flag lights up the admin moderation queue; repeat
    // offenders get warned/suspended manually.
    const isFlagged = containsContactDetails(content)

    const message = await prisma.$transaction(async (tx) => {
      const row = await tx.message.create({
        data: {
          threadId,
          senderId: user.id,
          content,
          isFlagged,
        },
      })
      await tx.messageThread.update({
        where: { id: threadId },
        data: { lastMessageAt: new Date() },
      })
      return row
    })

    // Live fan-out: push the persisted message to every socket on this thread
    // (the other participant's open thread view appends it in real time). The
    // sender's optimistic/refetch path dedupes by message id.
    broadcastToThread(threadId, message)

    // Notify the OTHER participant (sender already knows they sent it).
    // We need the recipient's userId — derive from the thread participants.
    const recipientUserId = await resolveRecipientUserId(thread, user.id)
    if (recipientUserId) {
      void NotificationService.notifyEvent({
        userId: recipientUserId,
        type: 'message_received',
        title: 'New message',
        body: content.length > 140 ? `${content.slice(0, 140)}…` : content,
        relatedEntityType: 'message_thread',
        relatedEntityId: threadId,
        email: { ctaUrl: `${env.FRONTEND_URL}/messages/${threadId}` },
      })
    }

    return message
  }

  static async markRead(user: UserCtx, threadId: string) {
    await loadThreadForUser(threadId, user)
    return prisma.message.updateMany({
      where: { threadId, senderId: { not: user.id }, readAt: null },
      data: { readAt: new Date() },
    })
  }

  /**
   * Report a thread for harassment / off-platform contact / other ToS issues
   * (PRD §13.3). Only a participant can report. We flag the COUNTERPARTY's
   * messages (isFlagged + flagReason) so they surface in the admin flagged
   * queue and the artist's existing in-thread flagged banner — and alert all
   * admins. Reported content is NOT hidden: removal stays an explicit, logged
   * admin action (mirrors the review-moderation model). A richer persisted
   * ContentReport model (reporter identity + audit) is the follow-up.
   */
  static async reportThread(user: UserCtx, threadId: string, reason: string, detail?: string) {
    await loadThreadForUser(threadId, user)
    const flagReason = detail ? `${reason}: ${detail}` : reason
    // senderId stores User.id, so "not the reporter" = the counterparty's messages.
    await prisma.message.updateMany({
      where: { threadId, senderId: { not: user.id }, isFlagged: false },
      data: { isFlagged: true, flagReason },
    })
    // Persist the report itself — captures WHO reported + WHY + outcome, so the
    // admin moderation view shows real reporter identity (not inferred) and the
    // report stays queryable after the flag is cleared.
    await prisma.contentReport.create({
      data: {
        reporterId: user.id,
        targetType: 'message_thread',
        targetId: threadId,
        reason,
        detail: detail ?? null,
      },
    })
    await NotificationService.notifyAdmins({
      type: 'thread_reported',
      title: 'A message thread was reported',
      body: `Reason: ${reason}${detail ? ` — ${detail}` : ''}`,
      relatedEntityType: 'message_thread',
      relatedEntityId: threadId,
    })
    return { ok: true as const }
  }
}
