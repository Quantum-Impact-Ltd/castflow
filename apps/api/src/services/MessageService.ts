import { prisma } from '../lib/prisma'
import { env } from '../lib/env'
import { AppError } from '../errors'
import { NotificationService } from './NotificationService'

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
    return prisma.messageThread.findMany({
      where,
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        job: { select: { id: true, title: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })
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

    const message = await prisma.$transaction(async (tx) => {
      const row = await tx.message.create({
        data: {
          threadId,
          senderId: user.id,
          content,
        },
      })
      await tx.messageThread.update({
        where: { id: threadId },
        data: { lastMessageAt: new Date() },
      })
      return row
    })

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
}
