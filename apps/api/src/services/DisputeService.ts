import type { RaiseDisputeInput, ResolveDisputeInput } from '@castflow/validators'
import type { z } from 'zod'
import type { submitDisputeSideSchema } from '@castflow/validators'

type SubmitDisputeEvidenceInput = z.infer<typeof submitDisputeSideSchema>
import { prisma } from '../lib/prisma'
import { env } from '../lib/env'
import { AppError } from '../errors'
import { NotificationService } from './NotificationService'
import { PaymentService } from './PaymentService'

interface UserCtx {
  id: string
  role: 'admin' | 'caster' | 'artist'
}

const DISPUTE_WINDOW_HOURS = 72

async function loadBookingParticipant(bookingId: string, user: UserCtx) {
  if (user.role === 'admin') {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) throw new AppError('NOT_FOUND', 'Booking not found', 404)
    return { booking, party: 'admin' as const }
  }
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      caster: { select: { userId: true, id: true } },
      artist: { select: { userId: true, id: true } },
    },
  })
  if (!booking) throw new AppError('NOT_FOUND', 'Booking not found', 404)
  if (user.role === 'caster' && booking.caster.userId === user.id) {
    return { booking, party: 'caster' as const }
  }
  if (user.role === 'artist' && booking.artist.userId === user.id) {
    return { booking, party: 'artist' as const }
  }
  throw new AppError('FORBIDDEN', 'Not a party to this booking', 403)
}

export class DisputeService {
  protected static readonly db = prisma

  /**
   * Raise a new dispute. Must be within 72h of shootDate.
   * One dispute per booking — DB-unique on bookingId.
   */
  static async raise(user: UserCtx, bookingId: string, input: RaiseDisputeInput) {
    if (user.role === 'admin') {
      throw new AppError('FORBIDDEN', 'Admins do not raise disputes', 403)
    }
    const { booking, party } = await loadBookingParticipant(bookingId, user)

    const hoursSinceShoot = (Date.now() - booking.shootDate.getTime()) / (1000 * 60 * 60)
    if (hoursSinceShoot > DISPUTE_WINDOW_HOURS) {
      throw new AppError(
        'DISPUTE_WINDOW_CLOSED',
        `Disputes can only be raised within ${DISPUTE_WINDOW_HOURS} hours of the shoot date`,
        400
      )
    }
    if (booking.status === 'cancelled') {
      throw new AppError('INVALID_STATE', 'Booking is cancelled', 400)
    }

    const existing = await prisma.dispute.findUnique({ where: { bookingId } })
    if (existing) {
      throw new AppError('DISPUTE_ALREADY_EXISTS', 'Booking already has a dispute', 409)
    }

    const raisedById = party === 'caster' ? booking.casterId : booking.artistId
    const raisedAgainstId = party === 'caster' ? booking.artistId : booking.casterId

    const dispute = await prisma.$transaction(async (tx) => {
      const row = await tx.dispute.create({
        data: {
          bookingId,
          raisedById,
          raisedAgainstId,
          reason: input.reason,
          description: input.description,
          status: 'open',
        },
      })
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'disputed' },
      })
      if (await tx.payment.findUnique({ where: { bookingId } })) {
        await tx.payment.update({
          where: { bookingId },
          data: { escrowStatus: 'disputed' },
        })
      }
      return row
    })

    // Notify the opposing party that a dispute was opened. The admin branch
    // of loadBookingParticipant skips the include — but raise() rejects admin
    // callers at the top, so the included shape is guaranteed here. Narrow
    // explicitly to satisfy TS.
    if (party === 'admin' || !('artist' in booking) || !('caster' in booking)) return dispute
    const opposingUserId = party === 'caster' ? booking.artist.userId : booking.caster.userId
    void NotificationService.notifyEvent({
      userId: opposingUserId,
      type: 'dispute_opened',
      title: 'A dispute was opened on your booking',
      body: `The ${party === 'caster' ? 'caster' : 'artist'} raised a dispute. Submit your evidence within 72 hours of the shoot date.`,
      relatedEntityType: 'dispute',
      relatedEntityId: dispute.id,
      email: { ctaUrl: `${env.FRONTEND_URL}/bookings/${bookingId}/dispute` },
    })

    return dispute
  }

  static async submitEvidence(user: UserCtx, bookingId: string, input: SubmitDisputeEvidenceInput) {
    if (user.role === 'admin') {
      throw new AppError('FORBIDDEN', 'Admins do not submit evidence', 403)
    }
    const { party } = await loadBookingParticipant(bookingId, user)
    const dispute = await prisma.dispute.findUnique({ where: { bookingId } })
    if (!dispute) throw new AppError('NOT_FOUND', 'Dispute not found', 404)
    if (dispute.status === 'resolved') {
      throw new AppError('INVALID_STATE', 'Dispute already resolved', 400)
    }

    return prisma.dispute.update({
      where: { id: dispute.id },
      data: {
        ...(party === 'caster'
          ? { casterSubmission: input.submission, casterSubmittedAt: new Date() }
          : { artistSubmission: input.submission, artistSubmittedAt: new Date() }),
        status: 'under_review',
      },
    })
  }

  static async get(user: UserCtx, bookingId: string) {
    if (user.role !== 'admin') {
      await loadBookingParticipant(bookingId, user)
    }
    const dispute = await prisma.dispute.findUnique({ where: { bookingId } })
    if (!dispute) throw new AppError('NOT_FOUND', 'Dispute not found', 404)
    return dispute
  }

  /**
   * Admin resolves a dispute. For 'split' the splitArtistPct is required; the
   * escrow is captured at that share and the remainder refunded. For
   * full_release / full_refund we simply call the existing payment helpers.
   */
  static async adminResolve(user: UserCtx, bookingId: string, input: ResolveDisputeInput) {
    if (user.role !== 'admin') {
      throw new AppError('FORBIDDEN', 'Admin only', 403)
    }
    const dispute = await prisma.dispute.findUnique({
      where: { bookingId },
      include: {
        booking: {
          include: {
            payment: true,
            caster: { select: { userId: true } },
            artist: { select: { userId: true } },
          },
        },
      },
    })
    if (!dispute) throw new AppError('NOT_FOUND', 'Dispute not found', 404)
    if (dispute.status === 'resolved') return dispute

    const splitArtistPct = input.splitArtistPct ?? 50

    const resolved = await prisma.$transaction(async (tx) => {
      const updates: Record<string, unknown> = {
        status: 'resolved',
        resolution: input.resolution,
        resolvedById: user.id,
        resolvedAt: new Date(),
        adminNotes: input.adminNotes ?? null,
      }
      if (input.resolution === 'split') {
        updates.splitArtistPct = splitArtistPct
      }
      const row = await tx.dispute.update({
        where: { id: dispute.id },
        data: updates,
      })

      await tx.adminLog.create({
        data: {
          adminId: user.id,
          action: 'resolve_dispute',
          entityType: 'dispute',
          entityId: dispute.id,
          notes: input.adminNotes ?? input.resolution,
        },
      })
      return row
    })

    // Money movement — runs outside the resolution transaction because the
    // Stripe calls are slow and we don't want them holding a DB transaction
    // open. The payment helpers are idempotent on escrowStatus, so admin
    // can safely re-invoke if a Stripe call fails mid-flight.
    //
    // Payment row may not exist if the booking never had escrow held — skip
    // money movement in that case.
    if (dispute.booking.payment) {
      try {
        switch (input.resolution) {
          case 'full_release_to_artist':
            await PaymentService.releaseEscrow(dispute.booking.id, { actor: 'auto' })
            break
          case 'full_refund_to_caster':
            await PaymentService.refundEscrow(
              dispute.booking.id,
              input.adminNotes ?? 'Dispute resolved in favour of caster'
            )
            break
          case 'split':
            await PaymentService.partialRelease(dispute.booking.id, splitArtistPct, {
              resolution: 'split',
              reason: input.adminNotes ?? 'Dispute resolved with split',
            })
            break
          case 'escalated':
            // No money movement — admin keeps escrow frozen pending external action.
            break
        }
      } catch (err) {
        // Don't swallow — admin needs to know if the money move failed so
        // they can retry from the Stripe dashboard. Log for ops, rethrow.
        console.error('[DisputeService] money movement failed during resolve', {
          disputeId: dispute.id,
          resolution: input.resolution,
          error: err instanceof Error ? err.message : String(err),
        })
        throw err
      }
    }

    // Notify both parties of the outcome.
    const body = `Admin resolved the dispute: ${input.resolution}${input.adminNotes ? ` — ${input.adminNotes}` : '.'}`
    for (const userId of [dispute.booking.caster.userId, dispute.booking.artist.userId]) {
      void NotificationService.notifyEvent({
        userId,
        type: 'dispute_resolved',
        title: 'Dispute resolved',
        body,
        relatedEntityType: 'dispute',
        relatedEntityId: dispute.id,
        email: { ctaUrl: `${env.FRONTEND_URL}/bookings/${bookingId}/dispute` },
      })
    }

    // Frivolous-dispute admin alert (PRD §13.5). A party "loses" when the
    // resolution favours the other side (`full_release_to_artist` is a loss
    // for the caster; `full_refund_to_caster` is a loss for the artist).
    // Splits and escalations don't count. On the 3rd lifetime loss for a
    // party we ping admins so they can decide whether to flag/suspend.
    let loserProfileId: string | null = null
    let loserSide: 'caster' | 'artist' | null = null
    if (input.resolution === 'full_release_to_artist') {
      loserProfileId = dispute.booking.casterId
      loserSide = 'caster'
    } else if (input.resolution === 'full_refund_to_caster') {
      loserProfileId = dispute.booking.artistId
      loserSide = 'artist'
    }
    if (loserProfileId && loserSide) {
      const losingResolution =
        loserSide === 'artist' ? 'full_refund_to_caster' : 'full_release_to_artist'
      const lostCount = await prisma.dispute.count({
        where: {
          resolution: losingResolution,
          booking:
            loserSide === 'artist' ? { artistId: loserProfileId } : { casterId: loserProfileId },
        },
      })
      if (lostCount >= 3) {
        void NotificationService.notifyAdmins({
          type: 'dispute_resolved',
          title: 'Frivolous-dispute pattern',
          body: `${loserSide === 'artist' ? 'Artist' : 'Caster'} ${loserProfileId} has now lost ${lostCount} disputes. Review for warning/suspension.`,
          relatedEntityType: loserSide === 'artist' ? 'artist_profile' : 'caster_profile',
          relatedEntityId: loserProfileId,
        })
      }
    }

    return resolved
  }
}
