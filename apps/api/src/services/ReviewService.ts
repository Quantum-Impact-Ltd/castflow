import type { SubmitReviewInput } from '@castflow/validators'
import { prisma } from '../lib/prisma'
import { env } from '../lib/env'
import { AppError } from '../errors'
import { NotificationService } from './NotificationService'

interface UserCtx {
  id: string
  role: 'admin' | 'caster' | 'artist'
}

async function loadBookingForReview(bookingId: string, user: UserCtx) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      caster: { select: { id: true, userId: true } },
      artist: { select: { id: true, userId: true } },
    },
  })
  if (!booking) throw new AppError('NOT_FOUND', 'Booking not found', 404)
  if (user.role === 'caster' && booking.caster.userId !== user.id) {
    throw new AppError('FORBIDDEN', 'Not your booking', 403)
  }
  if (user.role === 'artist' && booking.artist.userId !== user.id) {
    throw new AppError('FORBIDDEN', 'Not your booking', 403)
  }
  return booking
}

/**
 * Incremental cache update for a single new review. Avoids re-aggregating
 * the whole reviews table on every submission. When admin remove-review
 * lands, add a corresponding full-rebuild helper that re-aggregates
 * `prisma.review.aggregate` for authoritative recovery.
 */
async function applyRatingIncrement(
  tx: typeof prisma,
  target: 'artist' | 'caster',
  profileId: string,
  newRating: number
) {
  if (target === 'artist') {
    const profile = await tx.artistProfile.findUnique({
      where: { id: profileId },
      select: { ratingAvg: true, ratingCount: true },
    })
    if (!profile) return
    const oldCount = profile.ratingCount
    const oldAvg = Number(profile.ratingAvg ?? 0)
    const newCount = oldCount + 1
    const newAvg = (oldAvg * oldCount + newRating) / newCount
    await tx.artistProfile.update({
      where: { id: profileId },
      data: { ratingAvg: newAvg, ratingCount: newCount },
    })
  } else {
    const profile = await tx.casterProfile.findUnique({
      where: { id: profileId },
      select: { ratingAvg: true, ratingCount: true },
    })
    if (!profile) return
    const oldCount = profile.ratingCount
    const oldAvg = Number(profile.ratingAvg ?? 0)
    const newCount = oldCount + 1
    const newAvg = (oldAvg * oldCount + newRating) / newCount
    await tx.casterProfile.update({
      where: { id: profileId },
      data: { ratingAvg: newAvg, ratingCount: newCount },
    })
  }
}

export class ReviewService {
  protected static readonly db = prisma

  /**
   * Submit a review. Only one review per (booking, reviewer) — DB-enforced.
   * Bookings must be `completed` before either party can review.
   */
  static async submit(user: UserCtx, bookingId: string, input: SubmitReviewInput) {
    if (user.role === 'admin') {
      throw new AppError('FORBIDDEN', 'Admins do not submit reviews', 403)
    }

    const booking = await loadBookingForReview(bookingId, user)
    if (booking.status !== 'completed') {
      throw new AppError(
        'INVALID_STATE',
        'Bookings must be completed before they can be reviewed',
        400
      )
    }

    // PRD §10.9 — reviews accepted between 14 and 28 days post-shoot.
    const shootMs = booking.shootDate.getTime()
    const windowOpensAt = shootMs + 14 * 24 * 60 * 60 * 1000
    const windowClosesAt = shootMs + 28 * 24 * 60 * 60 * 1000
    const now = Date.now()
    if (now < windowOpensAt) {
      throw new AppError('INVALID_STATE', 'Reviews open 14 days after the shoot date', 400)
    }
    if (now > windowClosesAt) {
      throw new AppError(
        'INVALID_STATE',
        'Review window closed — reviews must be submitted within 28 days of the shoot',
        400
      )
    }

    const reviewerRole = user.role
    const reviewerProfileId = reviewerRole === 'caster' ? booking.caster.id : booking.artist.id
    const revieweeProfileId = reviewerRole === 'caster' ? booking.artist.id : booking.caster.id

    const existing = await prisma.review.findUnique({
      where: { bookingId_reviewerId: { bookingId, reviewerId: reviewerProfileId } },
      select: { id: true },
    })
    if (existing) {
      throw new AppError('INVALID_STATE', 'You have already reviewed this booking', 409)
    }

    // Split-FK schema: route the reviewee id into the right column depending
    // on which side is being reviewed. Exactly one column is non-null —
    // the `reviews_exactly_one_reviewee` CHECK constraint enforces this at
    // the DB level as well.
    const review = await prisma.$transaction(async (tx) => {
      const row = await tx.review.create({
        data: {
          bookingId,
          reviewerId: reviewerProfileId,
          ...(reviewerRole === 'caster'
            ? { artistRevieweeId: revieweeProfileId, casterRevieweeId: null }
            : { artistRevieweeId: null, casterRevieweeId: revieweeProfileId }),
          reviewerRole,
          rating: input.rating,
          comment: input.comment ?? null,
        },
      })
      // Incremental cache update — avoids re-aggregating every review.
      await applyRatingIncrement(
        tx as unknown as typeof prisma,
        reviewerRole === 'caster' ? 'artist' : 'caster',
        revieweeProfileId,
        input.rating
      )
      return row
    })

    const revieweeUserId = reviewerRole === 'caster' ? booking.artist.userId : booking.caster.userId
    void NotificationService.notifyEvent({
      userId: revieweeUserId,
      type: 'review_received',
      title: 'You received a new review',
      body: `${input.rating}★ review on your recent booking${input.comment ? `: "${input.comment.slice(0, 120)}"` : '.'}`,
      relatedEntityType: 'review',
      relatedEntityId: review.id,
      email: {
        ctaUrl: `${env.FRONTEND_URL}/${reviewerRole === 'caster' ? 'artist' : 'caster'}/reviews`,
      },
    })

    return review
  }

  static async listForBooking(user: UserCtx, bookingId: string) {
    await loadBookingForReview(bookingId, user)
    return prisma.review.findMany({
      where: { bookingId, isRemoved: false },
      orderBy: { createdAt: 'asc' },
    })
  }

  static async listForArtist(profileId: string) {
    return prisma.review.findMany({
      where: { artistRevieweeId: profileId, isRemoved: false },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async listForCaster(profileId: string) {
    return prisma.review.findMany({
      where: { casterRevieweeId: profileId, isRemoved: false },
      orderBy: { createdAt: 'desc' },
    })
  }
}
