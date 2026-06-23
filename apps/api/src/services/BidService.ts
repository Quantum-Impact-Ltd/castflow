import type { SubmitBidInput, UpdateBidInput, CounterOfferInput } from '@castflow/validators'
import type { BidStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { env } from '../lib/env'
import { AppError } from '../errors'
import { NotificationService } from './NotificationService'
import { SubscriptionService } from './SubscriptionService'

async function getArtistProfile(userId: string) {
  const profile = await prisma.artistProfile.findUnique({
    where: { userId },
    select: { id: true, approvalStatus: true },
  })
  if (!profile) throw new AppError('NOT_FOUND', 'Artist profile not found', 404)
  if (profile.approvalStatus !== 'approved') {
    throw new AppError('FORBIDDEN', 'Your account must be approved before bidding', 403)
  }
  return profile
}

async function getCasterProfileId(userId: string): Promise<string> {
  const caster = await prisma.casterProfile.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!caster) throw new AppError('NOT_FOUND', 'Caster profile not found', 404)
  return caster.id
}

export class BidService {
  protected static readonly db = prisma

  // ── Artist actions ────────────────────────────────────────────────────────

  static async submitBid(userId: string, jobId: string, input: SubmitBidInput) {
    const artist = await getArtistProfile(userId)

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        status: true,
        paymentType: true,
        visibility: true,
        applicationDeadline: true,
        headcountRequired: true,
        headcountFilled: true,
      },
    })
    if (!job) throw new AppError('NOT_FOUND', 'Job not found', 404)
    if (job.status !== 'active') throw new AppError('JOB_CLOSED', `Job is ${job.status}`, 410)
    if (new Date() > job.applicationDeadline) {
      throw new AppError('JOB_EXPIRED', 'Application deadline has passed', 410)
    }
    if (job.headcountFilled >= job.headcountRequired) {
      throw new AppError('JOB_FILLED', 'Job is fully booked', 410)
    }
    // invite_only jobs require an accepted invite from this artist.
    if (job.visibility === 'invite_only') {
      const invite = await prisma.jobInvite.findFirst({
        where: { jobId, artistId: artist.id, status: 'accepted' },
        select: { id: true },
      })
      if (!invite) {
        throw new AppError(
          'FORBIDDEN',
          'This job is invite-only — you need an accepted invite to bid',
          403
        )
      }
    }

    if (job.paymentType === 'hourly' && !input.estimatedHours) {
      throw new AppError(
        'HOURS_REQUIRED_FOR_HOURLY',
        'Estimated hours required for hourly jobs',
        400,
        { estimatedHours: ['Required'] }
      )
    }

    // One bid per (job, artist) is enforced by @@unique([jobId, artistId]). A
    // *withdrawn* bid is not an active commitment, so the artist may bid again
    // while the job is still open — we reuse the same row (UPDATE) to respect
    // the constraint. Any other existing status (pending/shortlisted/accepted/
    // rejected/expired) still blocks: pending/shortlisted should be edited, a
    // rejection is the caster's decision, and accepted/expired are terminal.
    const existing = await prisma.bid.findUnique({
      where: { jobId_artistId: { jobId, artistId: artist.id } },
      select: { id: true, status: true },
    })
    if (existing && existing.status !== 'withdrawn') {
      throw new AppError('DUPLICATE_BID', 'You have already bid on this job', 409)
    }

    const bidData = {
      proposedRate: input.proposedRate,
      estimatedHours:
        job.paymentType === 'hourly' && input.estimatedHours ? input.estimatedHours : null,
      coverNote: input.coverNote,
      highlightedPortfolioItems: input.highlightedPortfolioItems,
      status: 'pending' as const,
    }
    const includeJob = {
      job: { select: { title: true, caster: { select: { userId: true } } } },
    }
    const bid = existing
      ? await prisma.bid.update({
          where: { id: existing.id },
          // Re-bid: reset the row to a fresh pending bid (clear any stale
          // rejection reason, restamp submittedAt so it sorts as new).
          data: { ...bidData, rejectionReason: null, submittedAt: new Date() },
          include: includeJob,
        })
      : await prisma.bid.create({
          data: { jobId, artistId: artist.id, ...bidData },
          include: includeJob,
        })

    void NotificationService.notifyEvent({
      userId: bid.job.caster.userId,
      type: 'bid_received',
      title: 'New bid on your job',
      body: `You have a new bid on "${bid.job.title}".`,
      relatedEntityType: 'bid',
      relatedEntityId: bid.id,
      email: { ctaUrl: `${env.FRONTEND_URL}/caster/jobs/${jobId}/bids` },
    })

    return bid
  }

  /**
   * Artist edits their own bid while it's still pending (PRD §10.5).
   * Locked once the caster shortlists/rejects/accepts.
   */
  static async updateBid(userId: string, bidId: string, input: UpdateBidInput) {
    const artist = await getArtistProfile(userId)
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { job: { select: { paymentType: true } } },
    })
    if (!bid) throw new AppError('NOT_FOUND', 'Bid not found', 404)
    if (bid.artistId !== artist.id) throw new AppError('FORBIDDEN', 'Not your bid', 403)
    if (bid.status !== 'pending') {
      throw new AppError('BID_LOCKED', `Cannot edit a ${bid.status} bid`, 400)
    }

    if (bid.job.paymentType === 'hourly' && input.estimatedHours === null) {
      throw new AppError(
        'HOURS_REQUIRED_FOR_HOURLY',
        'Estimated hours required for hourly jobs',
        400,
        { estimatedHours: ['Required'] }
      )
    }

    const data: Record<string, unknown> = {}
    if (input.proposedRate !== undefined) data.proposedRate = input.proposedRate
    if (input.estimatedHours !== undefined) {
      data.estimatedHours = bid.job.paymentType === 'hourly' ? input.estimatedHours : null
    }
    if (input.coverNote !== undefined) data.coverNote = input.coverNote
    if (input.highlightedPortfolioItems !== undefined) {
      data.highlightedPortfolioItems = input.highlightedPortfolioItems
    }

    return prisma.bid.update({ where: { id: bidId }, data })
  }

  static async withdrawBid(userId: string, bidId: string) {
    const artist = await getArtistProfile(userId)
    const bid = await prisma.bid.findUnique({ where: { id: bidId } })
    if (!bid) throw new AppError('NOT_FOUND', 'Bid not found', 404)
    if (bid.artistId !== artist.id) throw new AppError('FORBIDDEN', 'Not your bid', 403)
    if (bid.status !== 'pending' && bid.status !== 'shortlisted') {
      throw new AppError('BID_LOCKED', `Cannot withdraw a ${bid.status} bid`, 400)
    }
    return prisma.bid.update({
      where: { id: bidId },
      data: { status: 'withdrawn' },
    })
  }

  static async listMyBids(
    userId: string,
    opts: { status?: BidStatus; cursor?: string; limit?: number } = {}
  ) {
    const artist = await getArtistProfile(userId)
    const take = Math.min(Math.max(opts.limit ?? 25, 1), 100)
    const rows = await prisma.bid.findMany({
      where: { artistId: artist.id, ...(opts.status ? { status: opts.status } : {}) },
      orderBy: { submittedAt: 'desc' },
      take: take + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
      include: {
        job: {
          select: {
            id: true,
            title: true,
            paymentType: true,
            shootDate: true,
            applicationDeadline: true,
            status: true,
          },
        },
      },
    })
    const hasNext = rows.length > take
    const items = hasNext ? rows.slice(0, take) : rows
    return { items, nextCursor: hasNext ? (items.at(-1)?.id ?? null) : null }
  }

  // ── Caster actions (feature 07) ───────────────────────────────────────────

  static async listBidsForJob(userId: string, jobId: string) {
    const casterId = await getCasterProfileId(userId)
    // Single round-trip: the where-clause IS the authz check. If the job
    // doesn't exist or doesn't belong to this caster we get null back.
    const job = await prisma.job.findFirst({
      where: { id: jobId, casterId },
      select: {
        id: true,
        bids: {
          orderBy: [{ status: 'asc' }, { submittedAt: 'asc' }],
          include: {
            artist: {
              select: {
                id: true,
                firstName: true,
                artistType: true,
                city: true,
                ratingAvg: true,
                ratingCount: true,
                portfolioItems: { take: 5, where: { isApproved: true } },
              },
            },
          },
        },
      },
    })
    if (!job) throw new AppError('NOT_FOUND', 'Job not found', 404)
    return job.bids
  }

  static async shortlistBid(userId: string, bidId: string) {
    return BidService.transitionStatus(userId, bidId, 'shortlisted', ['pending'])
  }

  static async rejectBid(userId: string, bidId: string, reason?: string) {
    const casterId = await getCasterProfileId(userId)
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        job: { select: { casterId: true, title: true } },
        artist: { select: { userId: true } },
      },
    })
    if (!bid) throw new AppError('NOT_FOUND', 'Bid not found', 404)
    if (bid.job.casterId !== casterId) throw new AppError('FORBIDDEN', 'Not your job', 403)
    if (bid.status === 'rejected') return bid
    if (bid.status === 'accepted') {
      throw new AppError('BID_LOCKED', 'Cannot reject an accepted bid', 400)
    }
    const updated = await prisma.bid.update({
      where: { id: bidId },
      data: { status: 'rejected', rejectionReason: reason ?? null },
    })

    void NotificationService.notifyEvent({
      userId: bid.artist.userId,
      type: 'bid_rejected',
      title: 'Your bid was declined',
      body: `Your bid on "${bid.job.title}" was not selected${reason ? `: ${reason}` : '.'}`,
      relatedEntityType: 'bid',
      relatedEntityId: bid.id,
      email: { ctaUrl: `${env.FRONTEND_URL}/artist/bids` },
    })

    return updated
  }

  /**
   * Caster undoes a rejection within 24 hours (PRD §10.5). Restores the bid
   * to `pending` so it shows up in the open-bids list again.
   */
  static async undoReject(userId: string, bidId: string) {
    const casterId = await getCasterProfileId(userId)
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        job: { select: { casterId: true, status: true, title: true } },
        artist: { select: { userId: true } },
      },
    })
    if (!bid) throw new AppError('NOT_FOUND', 'Bid not found', 404)
    if (bid.job.casterId !== casterId) throw new AppError('FORBIDDEN', 'Not your job', 403)
    if (bid.status !== 'rejected') {
      throw new AppError('INVALID_STATE', `Bid is ${bid.status}, not rejected`, 400)
    }
    const hoursSinceReject = (Date.now() - bid.updatedAt.getTime()) / (1000 * 60 * 60)
    if (hoursSinceReject > 24) {
      throw new AppError(
        'INVALID_STATE',
        'Undo window has closed — rejections can only be reversed within 24 hours',
        400
      )
    }
    if (bid.job.status !== 'active') {
      throw new AppError('JOB_CLOSED', `Job is ${bid.job.status}`, 410)
    }

    const updated = await prisma.bid.update({
      where: { id: bidId },
      data: { status: 'pending', rejectionReason: null },
    })

    void NotificationService.notifyEvent({
      userId: bid.artist.userId,
      type: 'bid_received',
      title: 'Your bid is back in consideration',
      body: `The caster restored your bid on "${bid.job.title}" — it's pending again.`,
      relatedEntityType: 'bid',
      relatedEntityId: bid.id,
      email: { ctaUrl: `${env.FRONTEND_URL}/artist/bids` },
    })

    return updated
  }

  /**
   * Caster accepts a bid — creates the booking + locks the message thread open.
   * Requires an active subscription. No platform payment is taken: the job fee
   * is settled directly between caster and artist, off-platform. The next step
   * is contract generation + signing.
   */
  static async acceptBid(userId: string, bidId: string, shootLocation: string) {
    const casterId = await getCasterProfileId(userId)
    await SubscriptionService.assertActiveSubscription(casterId)

    const booking = await prisma.$transaction(async (tx) => {
      const bid = await tx.bid.findUnique({
        where: { id: bidId },
        include: {
          job: true,
          artist: { select: { id: true, userId: true } },
        },
      })
      if (!bid) throw new AppError('NOT_FOUND', 'Bid not found', 404)
      if (bid.job.casterId !== casterId) throw new AppError('FORBIDDEN', 'Not your job', 403)
      if (bid.status !== 'pending' && bid.status !== 'shortlisted') {
        throw new AppError('BID_NOT_PENDING', `Cannot accept a ${bid.status} bid`, 400)
      }
      if (bid.job.headcountFilled >= bid.job.headcountRequired) {
        throw new AppError('JOB_FILLED', 'Job already filled', 410)
      }

      const agreedRate = bid.proposedRate
      const agreedHours = bid.estimatedHours
      const totalAmount =
        bid.job.paymentType === 'hourly' && agreedHours
          ? Number(agreedRate) * Number(agreedHours)
          : Number(agreedRate)

      const booking = await tx.booking.create({
        data: {
          jobId: bid.jobId,
          bidId: bid.id,
          casterId,
          artistId: bid.artistId,
          paymentType: bid.job.paymentType,
          agreedRate,
          agreedHours: agreedHours ?? null,
          totalAmount,
          shootDate: bid.job.shootDate,
          shootLocation,
          status: 'pending_contract',
        },
      })

      await tx.bid.update({
        where: { id: bidId },
        data: { status: 'accepted' },
      })

      // Lock the message thread open for ongoing coordination (creates if missing).
      await tx.messageThread.upsert({
        where: {
          jobId_casterId_artistId: {
            jobId: bid.jobId,
            casterId,
            artistId: bid.artistId,
          },
        },
        create: {
          jobId: bid.jobId,
          casterId,
          artistId: bid.artistId,
          unlocked: true,
        },
        update: { unlocked: true },
      })

      // Bump headcountFilled — if it now matches headcountRequired, expire pending bids.
      const newCount = bid.job.headcountFilled + 1
      const jobUpdate = {
        headcountFilled: newCount,
        ...(newCount >= bid.job.headcountRequired ? { status: 'filled' as const } : {}),
      }
      await tx.job.update({ where: { id: bid.jobId }, data: jobUpdate })

      if (newCount >= bid.job.headcountRequired) {
        await tx.bid.updateMany({
          where: { jobId: bid.jobId, status: { in: ['pending', 'shortlisted'] } },
          data: { status: 'expired' },
        })
      }

      return {
        booking,
        artistUserId: bid.artist.userId,
        jobTitle: bid.job.title,
      }
    })

    void NotificationService.notifyEvent({
      userId: booking.artistUserId,
      type: 'bid_accepted',
      title: 'Your bid was accepted!',
      body: `You've been booked for "${booking.jobTitle}". Next step: a contract is generated for both of you to sign. Payment is arranged directly with the caster, off-platform.`,
      relatedEntityType: 'booking',
      relatedEntityId: booking.booking.id,
      email: { ctaUrl: `${env.FRONTEND_URL}/artist/bookings/${booking.booking.id}` },
    })

    return booking.booking
  }

  private static async transitionStatus(
    userId: string,
    bidId: string,
    target: BidStatus,
    allowedFrom: BidStatus[]
  ) {
    const casterId = await getCasterProfileId(userId)
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        job: { select: { casterId: true, id: true, title: true } },
        artist: { select: { id: true, userId: true } },
      },
    })
    if (!bid) throw new AppError('NOT_FOUND', 'Bid not found', 404)
    if (bid.job.casterId !== casterId) throw new AppError('FORBIDDEN', 'Not your job', 403)
    if (!allowedFrom.includes(bid.status)) {
      throw new AppError('BID_NOT_PENDING', `Cannot transition from ${bid.status}`, 400)
    }

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.bid.update({
        where: { id: bidId },
        data: { status: target },
      })

      // Shortlisting unlocks the messaging thread between caster + this artist.
      if (target === 'shortlisted') {
        await tx.messageThread.upsert({
          where: {
            jobId_casterId_artistId: {
              jobId: bid.job.id,
              casterId,
              artistId: bid.artist.id,
            },
          },
          create: {
            jobId: bid.job.id,
            casterId,
            artistId: bid.artist.id,
            unlocked: true,
          },
          update: { unlocked: true },
        })
      }

      return row
    })

    if (target === 'shortlisted') {
      void NotificationService.notifyEvent({
        userId: bid.artist.userId,
        type: 'bid_shortlisted',
        title: 'You were shortlisted!',
        body: `The caster has shortlisted you for "${bid.job.title}". Messaging is now unlocked.`,
        relatedEntityType: 'bid',
        relatedEntityId: bid.id,
        email: { ctaUrl: `${env.FRONTEND_URL}/artist/bids` },
      })
    }

    return updated
  }

  // ── Counter-offers (Phase 2) ─────────────────────────────────────────────
  // Artist proposes a different rate after being shortlisted. Caster
  // accepts (overwrites bid.proposedRate / estimatedHours) or declines
  // (counter stays declined, bid keeps its original rate, status unchanged).
  // Only one pending counter per bid at a time.

  static async proposeCounterOffer(userId: string, bidId: string, input: CounterOfferInput) {
    const artist = await getArtistProfile(userId)
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: {
        job: { select: { paymentType: true, title: true, caster: { select: { userId: true } } } },
      },
    })
    if (!bid) throw new AppError('NOT_FOUND', 'Bid not found', 404)
    if (bid.artistId !== artist.id) throw new AppError('FORBIDDEN', 'Not your bid', 403)
    if (bid.status !== 'shortlisted') {
      throw new AppError(
        'BID_NOT_PENDING',
        'Counter-offers can only be proposed on shortlisted bids',
        400
      )
    }
    if (bid.job.paymentType === 'hourly' && !input.estimatedHours) {
      throw new AppError(
        'HOURS_REQUIRED_FOR_HOURLY',
        'Estimated hours required for hourly jobs',
        400,
        { estimatedHours: ['Required'] }
      )
    }

    const existingPending = await prisma.counterOffer.findFirst({
      where: { bidId, status: 'pending' },
      select: { id: true },
    })
    if (existingPending) {
      throw new AppError('INVALID_STATE', 'A pending counter-offer already exists on this bid', 409)
    }

    const offer = await prisma.counterOffer.create({
      data: {
        bidId,
        proposedRate: input.proposedRate,
        estimatedHours:
          bid.job.paymentType === 'hourly' && input.estimatedHours ? input.estimatedHours : null,
        message: input.message ?? null,
        status: 'pending',
      },
    })

    void NotificationService.notifyEvent({
      userId: bid.job.caster.userId,
      type: 'bid_received',
      title: 'Counter-offer on a shortlisted bid',
      body: `An artist proposed a new rate of £${input.proposedRate} on "${bid.job.title}".`,
      relatedEntityType: 'counter_offer',
      relatedEntityId: offer.id,
      email: { ctaUrl: `${env.FRONTEND_URL}/caster/bids/${bidId}` },
    })

    return offer
  }

  static async acceptCounterOffer(userId: string, counterOfferId: string) {
    return BidService.respondToCounterOffer(userId, counterOfferId, 'accepted')
  }

  static async declineCounterOffer(userId: string, counterOfferId: string) {
    return BidService.respondToCounterOffer(userId, counterOfferId, 'declined')
  }

  private static async respondToCounterOffer(
    userId: string,
    counterOfferId: string,
    target: 'accepted' | 'declined'
  ) {
    const casterId = await getCasterProfileId(userId)
    const offer = await prisma.counterOffer.findUnique({
      where: { id: counterOfferId },
      include: {
        bid: {
          include: {
            job: { select: { casterId: true, title: true } },
            artist: { select: { userId: true } },
          },
        },
      },
    })
    if (!offer) throw new AppError('NOT_FOUND', 'Counter-offer not found', 404)
    if (offer.bid.job.casterId !== casterId) {
      throw new AppError('FORBIDDEN', 'Not your job', 403)
    }
    if (offer.status !== 'pending') {
      throw new AppError('INVALID_STATE', `Counter-offer already ${offer.status}`, 400)
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.counterOffer.update({
        where: { id: counterOfferId },
        data: { status: target, respondedAt: new Date() },
      })
      if (target === 'accepted') {
        await tx.bid.update({
          where: { id: offer.bidId },
          data: {
            proposedRate: offer.proposedRate,
            estimatedHours: offer.estimatedHours,
          },
        })
      }

      void NotificationService.notifyEvent({
        userId: offer.bid.artist.userId,
        type: target === 'accepted' ? 'bid_shortlisted' : 'bid_received',
        title: target === 'accepted' ? 'Counter-offer accepted' : 'Counter-offer declined',
        body:
          target === 'accepted'
            ? `The caster accepted your counter-offer of £${Number(offer.proposedRate)} on "${offer.bid.job.title}".`
            : `The caster declined your counter-offer on "${offer.bid.job.title}". Your original bid still stands.`,
        relatedEntityType: 'counter_offer',
        relatedEntityId: offer.id,
        email: { ctaUrl: `${env.FRONTEND_URL}/artist/bids` },
      })

      return updated
    })
  }
}
