import { prisma } from '../lib/prisma'
import { env } from '../lib/env'
import { AppError } from '../errors'
import { PaymentService } from './PaymentService'
import { NotificationService } from './NotificationService'

interface UserCtx {
  id: string
  role: 'admin' | 'caster' | 'artist'
}

async function loadBookingForUser(bookingId: string, user: UserCtx) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      caster: { select: { id: true, userId: true, companyName: true } },
      artist: {
        select: { id: true, userId: true, firstName: true, lastName: true, artistType: true },
      },
      contract: true,
      payment: true,
      job: { select: { id: true, title: true } },
    },
  })
  if (!booking) throw new AppError('NOT_FOUND', 'Booking not found', 404)
  if (user.role === 'admin') return booking
  if (user.role === 'caster' && booking.caster.userId === user.id) return booking
  if (user.role === 'artist' && booking.artist.userId === user.id) return booking
  throw new AppError('FORBIDDEN', 'Not your booking', 403)
}

/**
 * shootLocation + callTime are hidden until contract is fully_signed (spec).
 */
function stripPreSignedFields<
  T extends {
    shootLocation: string
    callTime: Date | null
    contract: { status: string } | null
  },
>(booking: T): T {
  const signed = booking.contract?.status === 'fully_signed'
  if (signed) return booking
  return { ...booking, shootLocation: '', callTime: null }
}

export class BookingService {
  protected static readonly db = prisma

  static async getMyBookings(user: UserCtx, opts: { cursor?: string; limit?: number } = {}) {
    const take = Math.min(Math.max(opts.limit ?? 25, 1), 100)

    if (user.role === 'artist') {
      const artist = await prisma.artistProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      if (!artist) throw new AppError('NOT_FOUND', 'Artist profile not found', 404)
      const rows = await prisma.booking.findMany({
        where: { artistId: artist.id },
        orderBy: { shootDate: 'desc' },
        take: take + 1,
        ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
        include: {
          job: { select: { title: true, paymentType: true } },
          caster: { select: { companyName: true } },
          contract: { select: { status: true } },
          payment: {
            select: {
              escrowStatus: true,
              grossAmount: true,
              platformCommissionAmount: true,
              netArtistAmount: true,
              autoReleaseAt: true,
              releasedAt: true,
              paidAt: true,
            },
          },
        },
      })
      const hasNext = rows.length > take
      const sliced = hasNext ? rows.slice(0, take) : rows
      const items = sliced.map((r) => ({
        ...r,
        shootLocation: r.contract?.status === 'fully_signed' ? r.shootLocation : '',
        callTime: r.contract?.status === 'fully_signed' ? r.callTime : null,
      }))
      return { items, nextCursor: hasNext ? (items.at(-1)?.id ?? null) : null }
    }

    if (user.role === 'caster') {
      const caster = await prisma.casterProfile.findUnique({
        where: { userId: user.id },
        select: { id: true },
      })
      if (!caster) throw new AppError('NOT_FOUND', 'Caster profile not found', 404)
      const rows = await prisma.booking.findMany({
        where: { casterId: caster.id },
        orderBy: { shootDate: 'desc' },
        take: take + 1,
        ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
        include: {
          job: { select: { title: true, paymentType: true } },
          artist: { select: { firstName: true, lastName: true } },
          contract: { select: { status: true } },
          payment: { select: { escrowStatus: true } },
        },
      })
      const hasNext = rows.length > take
      const items = hasNext ? rows.slice(0, take) : rows
      return { items, nextCursor: hasNext ? (items.at(-1)?.id ?? null) : null }
    }

    throw new AppError('FORBIDDEN', 'Admins use the admin endpoints', 403)
  }

  static async getById(user: UserCtx, bookingId: string) {
    const booking = await loadBookingForUser(bookingId, user)
    // Only re-fetch if the lazy auto-release actually mutated something.
    if (booking.payment) {
      const released = await PaymentService.maybeAutoRelease(booking.id)
      if (released && released.escrowStatus !== booking.payment.escrowStatus) {
        const fresh = await loadBookingForUser(bookingId, user)
        return stripPreSignedFields(fresh)
      }
    }
    return stripPreSignedFields(booking)
  }

  /**
   * Caster confirms shoot completion. Date-locked: must be on/after shootDate.
   * Auto-releases escrow.
   */
  static async confirmCompletion(user: UserCtx, bookingId: string) {
    if (user.role !== 'caster') {
      throw new AppError('FORBIDDEN', 'Only the caster can confirm completion', 403)
    }
    const booking = await loadBookingForUser(bookingId, user)
    if (booking.status === 'completed') return booking
    if (booking.status !== 'confirmed') {
      throw new AppError('INVALID_STATE', `Booking is ${booking.status}`, 400)
    }
    if (new Date() < booking.shootDate) {
      throw new AppError(
        'SHOOT_DATE_NOT_PASSED',
        'Cannot confirm completion before the shoot date',
        400
      )
    }
    await PaymentService.releaseEscrow(booking.id, { actor: 'caster' })
    return loadBookingForUser(bookingId, user)
  }

  /**
   * Either party may cancel a confirmed booking. Fee and side-effect tier
   * comes from PRD §10.6. The actual Stripe split (capturing the fee instead
   * of refunding it back to the cancelling party) is part of the deferred
   * "cancellation fee Stripe split" work — for now the fee is recorded on
   * the Payment row and the full escrow is refunded.
   *
   *   Artist cancels:
   *     >7 days   → no fee, full refund, no penalty
   *     3–7 days  → no fee, full refund, warning  (TODO: strike system)
   *     <48 h     → 50% fee, 50% refund, strike   (TODO: strike system)
   *   Caster cancels:
   *     >48 h     → no fee, full refund
   *     <48 h     → 50% fee paid to artist, 50% refund to caster
   */
  static async cancel(user: UserCtx, bookingId: string, reason: string) {
    if (!reason || reason.trim().length < 3) {
      throw new AppError('VALIDATION_ERROR', 'Reason is required', 400, {
        reason: ['Required'],
      })
    }
    const booking = await loadBookingForUser(bookingId, user)
    if (booking.status === 'cancelled') return booking
    if (booking.status === 'completed') {
      throw new AppError('INVALID_STATE', 'Cannot cancel a completed booking', 400)
    }

    const cancellingParty = user.role as 'caster' | 'artist'
    const msUntilShoot = booking.shootDate.getTime() - Date.now()
    const daysUntilShoot = msUntilShoot / (1000 * 60 * 60 * 24)
    const hoursUntilShoot = msUntilShoot / (1000 * 60 * 60)

    type Tier = 'more_than_7d' | '3_to_7d' | 'under_48h' | 'more_than_48h'
    let tier: Tier
    if (cancellingParty === 'artist') {
      if (daysUntilShoot > 7) tier = 'more_than_7d'
      else if (hoursUntilShoot >= 48) tier = '3_to_7d'
      else tier = 'under_48h'
    } else {
      tier = hoursUntilShoot < 48 ? 'under_48h' : 'more_than_48h'
    }

    if (booking.payment && booking.payment.escrowStatus === 'held') {
      if (tier === 'under_48h') {
        // Under-48h tier: artist receives 50% as cancellation fee, caster
        // gets 50% refund. Try the Stripe partial-capture path. If the
        // artist hasn't onboarded to Connect, fall back to a full refund
        // and persist the fee amount for admin reconciliation.
        try {
          await PaymentService.partialRelease(booking.id, 50, {
            reason,
            resolution: 'cancellation_fee',
          })
        } catch (err) {
          if (err instanceof AppError && err.code === 'PAYOUT_NOT_READY') {
            console.warn('[BookingService] late-cancel fee fallback: artist not Connect-ready', {
              bookingId: booking.id,
            })
            await PaymentService.refundEscrow(booking.id, reason)
            await prisma.payment.update({
              where: { bookingId: booking.id },
              data: { cancellationFeeAmount: Number(booking.totalAmount) * 0.5 },
            })
          } else {
            throw err
          }
        }
      } else {
        // Tiers above 48h: clean full refund, no fee.
        await PaymentService.refundEscrow(booking.id, reason)
      }
    }

    // Strike system (PRD §10.6): artist-initiated late cancels increment
    // strikeCount; caster cancels do not. On the 3rd strike fan an alert
    // out to all admins for review per PRD §13.4 — admin decides whether
    // to suspend.
    if (cancellingParty === 'artist' && tier === 'under_48h') {
      const updated = await prisma.artistProfile.update({
        where: { id: booking.artistId },
        data: { strikeCount: { increment: 1 } },
        select: { id: true, strikeCount: true, firstName: true, lastName: true },
      })
      if (updated.strikeCount >= 3) {
        void NotificationService.notifyAdmins({
          type: 'artist_rejected', // reuse — closest existing "admin attention" type
          title: '3-strike review required',
          body: `Artist ${updated.firstName} ${updated.lastName} (${updated.id}) reached ${updated.strikeCount} late-cancel strikes. Review whether to suspend.`,
          relatedEntityType: 'artist_profile',
          relatedEntityId: updated.id,
        })
      }
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'cancelled',
        cancelledBy: cancellingParty,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    })

    // Notify the OTHER party — they already know if they cancelled.
    const otherUserId = cancellingParty === 'caster' ? booking.artist.userId : booking.caster.userId
    void NotificationService.notifyEvent({
      userId: otherUserId,
      type:
        cancellingParty === 'caster'
          ? 'booking_cancelled_by_caster'
          : 'booking_cancelled_by_artist',
      title: 'Booking cancelled',
      body: `${cancellingParty === 'caster' ? 'The caster' : 'The artist'} cancelled the booking for "${booking.job.title}": ${reason}`,
      relatedEntityType: 'booking',
      relatedEntityId: booking.id,
      email: { ctaUrl: `${env.FRONTEND_URL}/bookings/${booking.id}` },
    })

    return updated
  }
}
