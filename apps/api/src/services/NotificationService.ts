import { prisma } from '../lib/prisma'
import { env } from '../lib/env'
import { AppError } from '../errors'
import { EmailService } from './EmailService'

/**
 * In-app + email notification dispatch. For MVP we persist notifications to
 * the DB synchronously inside the originating transaction (caller passes the
 * tx if available); the email side is fire-and-forget against EmailService.
 *
 * Spec callout: matching-job notifications use a daily digest, all others are
 * real-time. The digest scheduler lives elsewhere; we just write rows here.
 */

export type CastflowNotificationType =
  | 'artist_approved'
  | 'artist_rejected'
  | 'bid_received'
  | 'bid_shortlisted'
  | 'bid_rejected'
  | 'bid_accepted'
  | 'bid_expired'
  | 'booking_confirmed'
  | 'booking_cancelled_by_caster'
  | 'booking_cancelled_by_artist'
  | 'contract_ready'
  | 'contract_signed_by_other'
  | 'contract_fully_signed'
  | 'payment_held'
  | 'payment_released'
  | 'payment_failed'
  | 'payout_sent'
  | 'dispute_opened'
  | 'dispute_resolved'
  | 'message_received'
  | 'job_matching_posted'
  | 'job_expiring_soon'
  | 'job_expired'
  | 'review_received'
  | 'invite_received'
  | 'invite_accepted'
  | 'invite_declined'

interface CreateArgs {
  userId: string
  type: CastflowNotificationType
  title: string
  body: string
  relatedEntityType?: string
  relatedEntityId?: string
}

export class NotificationService {
  protected static readonly db = prisma

  static async create(args: CreateArgs) {
    return prisma.notification.create({
      data: {
        userId: args.userId,
        type: args.type,
        title: args.title,
        body: args.body,
        relatedEntityType: args.relatedEntityType ?? null,
        relatedEntityId: args.relatedEntityId ?? null,
      },
    })
  }

  /**
   * Fire-and-forget convenience used at service event sites: writes the
   * in-app notification row AND sends a parallel email. Errors are swallowed
   * (logged) so a Resend hiccup never poisons the originating business
   * operation. Pass `email: false` for events that should be in-app only.
   */
  static async notifyEvent(args: {
    userId: string
    type: CastflowNotificationType
    title: string
    body: string
    relatedEntityType?: string
    relatedEntityId?: string
    email?: false | { ctaUrl?: string; ctaLabel?: string }
  }): Promise<void> {
    try {
      await NotificationService.create({
        userId: args.userId,
        type: args.type,
        title: args.title,
        body: args.body,
        ...(args.relatedEntityType ? { relatedEntityType: args.relatedEntityType } : {}),
        ...(args.relatedEntityId ? { relatedEntityId: args.relatedEntityId } : {}),
      })
    } catch (err) {
      console.error('[NotificationService] in-app create failed', {
        userId: args.userId,
        type: args.type,
        error: err instanceof Error ? err.message : String(err),
      })
    }

    if (args.email === false) return
    try {
      const user = await prisma.user.findUnique({
        where: { id: args.userId },
        select: { email: true },
      })
      if (!user) return
      const cta = args.email?.ctaUrl
        ? `<p><a href="${args.email.ctaUrl}">${args.email.ctaLabel ?? 'Open CastFlow'}</a></p>`
        : `<p><a href="${env.FRONTEND_URL}">Open CastFlow</a></p>`
      const html = `
        <h1>${args.title}</h1>
        <p>${args.body}</p>
        ${cta}
      `
      await EmailService.sendEvent({ to: user.email, subject: args.title, html })
    } catch (err) {
      console.error('[NotificationService] email dispatch failed', {
        userId: args.userId,
        type: args.type,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  static async listForUser(userId: string, opts?: { unreadOnly?: boolean; limit?: number }) {
    const take = Math.min(Math.max(opts?.limit ?? 50, 1), 200)
    return prisma.notification.findMany({
      where: { userId, ...(opts?.unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: 'desc' },
      take,
    })
  }

  static async markRead(userId: string, notificationIds: string[]) {
    if (notificationIds.length === 0) return { count: 0 }
    return prisma.notification.updateMany({
      where: { userId, id: { in: notificationIds } },
      data: { readAt: new Date() },
    })
  }

  static async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    })
  }

  static async deleteOne(userId: string, notificationId: string) {
    const owned = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
      select: { id: true },
    })
    if (!owned) throw new AppError('NOT_FOUND', 'Notification not found', 404)
    await prisma.notification.delete({ where: { id: notificationId } })
    return { id: notificationId }
  }
}
