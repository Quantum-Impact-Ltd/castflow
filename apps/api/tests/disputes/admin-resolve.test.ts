import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { DisputeService } from '../../src/services/DisputeService'
import { prisma } from '../../src/lib/prisma'
import { stripe } from '../../src/lib/stripe'
import { AppError } from '../../src/errors'
import {
  createBookingScenario,
  createTestAdmin,
  createTestArtist,
  createTestCaster,
  createTestBid,
  createTestBooking,
  createTestJob,
  createTestPayment,
} from '../helpers/factories'
import { cleanupTestData } from '../helpers/cleanup'
import { resetStripeMockCalls, resetStripeMockState, stripeMockState } from '../helpers/stripe-mock'

const TEST_TIMEOUT = 30_000

beforeAll(async () => {
  await cleanupTestData()
}, 60_000)
beforeEach(() => {
  resetStripeMockCalls()
  resetStripeMockState()
})
afterAll(async () => {
  await cleanupTestData()
}, 60_000)

/**
 * Create a booking scenario plus an OPEN dispute, return the resolver-needed
 * handles. Keeps each test's setup terse.
 */
async function disputeScenario(
  opts: {
    totalAmount?: number
    artistPayoutsEnabled?: boolean
    artistStripeAccountId?: string | null
  } = {}
) {
  const scenario = await createBookingScenario({
    artistPayoutsEnabled: opts.artistPayoutsEnabled ?? true,
    ...(opts.artistStripeAccountId !== undefined
      ? { artistStripeAccountId: opts.artistStripeAccountId }
      : {}),
    escrowStatus: 'held',
    totalAmount: opts.totalAmount ?? 1000,
  })
  const dispute = await prisma.dispute.create({
    data: {
      bookingId: scenario.booking.id,
      raisedById: scenario.caster.id,
      raisedAgainstId: scenario.artist.id,
      reason: 'no-show',
      description: 'Artist did not arrive at call time.',
      status: 'under_review',
    },
  })
  return { ...scenario, dispute }
}

describe('DisputeService.adminResolve', () => {
  it(
    'full_release_to_artist → captures + transfers to artist Connect, marks payment released',
    async () => {
      const admin = await createTestAdmin()
      const { booking, payment, artist } = await disputeScenario({ totalAmount: 1000 })

      await DisputeService.adminResolve({ id: admin.id, role: 'admin' }, booking.id, {
        resolution: 'full_release_to_artist',
        adminNotes: 'no-show not substantiated, full release',
      })

      const freshPayment = await prisma.payment.findUnique({ where: { id: payment.id } })
      expect(freshPayment?.escrowStatus).toBe('released')
      expect(stripe.paymentIntents.capture).toHaveBeenCalledTimes(1)
      const transferCall = stripeMockState.transfers.at(-1)
      expect(transferCall?.amount).toBe(85000) // £1000 less 15% commission → 85000 pence
      expect(transferCall?.destination).toBe(artist.stripeAccountId)

      const freshDispute = await prisma.dispute.findUnique({ where: { bookingId: booking.id } })
      expect(freshDispute?.status).toBe('resolved')
      expect(freshDispute?.resolution).toBe('full_release_to_artist')
      expect(freshDispute?.resolvedById).toBe(admin.id)

      // AdminLog row written for the resolve action.
      const log = await prisma.adminLog.findFirst({
        where: { adminId: admin.id, entityType: 'dispute', entityId: freshDispute?.id },
      })
      expect(log).not.toBeNull()
      expect(log?.action).toBe('resolve_dispute')
    },
    TEST_TIMEOUT
  )

  it(
    'full_refund_to_caster → cancels payment intent, marks refunded, no transfer',
    async () => {
      const admin = await createTestAdmin()
      const { booking, payment } = await disputeScenario()

      await DisputeService.adminResolve({ id: admin.id, role: 'admin' }, booking.id, {
        resolution: 'full_refund_to_caster',
        adminNotes: 'artist breached terms',
      })

      const freshPayment = await prisma.payment.findUnique({ where: { id: payment.id } })
      expect(freshPayment?.escrowStatus).toBe('refunded')
      expect(stripe.paymentIntents.cancel).toHaveBeenCalledTimes(1)
      expect(stripe.transfers.create).not.toHaveBeenCalled()
    },
    TEST_TIMEOUT
  )

  it(
    'split with splitArtistPct=70 → partialRelease(70), persists splitArtistPct on dispute',
    async () => {
      const admin = await createTestAdmin()
      const { booking, payment, dispute } = await disputeScenario({ totalAmount: 1000 })

      await DisputeService.adminResolve({ id: admin.id, role: 'admin' }, booking.id, {
        resolution: 'split',
        splitArtistPct: 70,
      })

      const freshPayment = await prisma.payment.findUnique({ where: { id: payment.id } })
      expect(freshPayment?.escrowStatus).toBe('partially_refunded')

      // 70% of £1000 = £700 = 70000 pence; net to artist = 70000 - 10500 = 59500
      expect(stripe.paymentIntents.capture).toHaveBeenCalledWith(
        freshPayment?.stripePaymentIntentId,
        { amount_to_capture: 70000 }
      )
      const transferCall = stripeMockState.transfers.at(-1)
      expect(transferCall?.amount).toBe(59500)
      expect(transferCall?.metadata.resolution).toBe('split')

      const freshDispute = await prisma.dispute.findUnique({ where: { id: dispute.id } })
      expect(freshDispute?.splitArtistPct).toBe(70)
    },
    TEST_TIMEOUT
  )

  it(
    'escalated → no money movement, dispute marked resolved with escalated resolution',
    async () => {
      const admin = await createTestAdmin()
      const { booking, payment, dispute } = await disputeScenario()

      await DisputeService.adminResolve({ id: admin.id, role: 'admin' }, booking.id, {
        resolution: 'escalated',
        adminNotes: 'kicking to external mediator',
      })

      // No Stripe activity at all.
      expect(stripe.paymentIntents.capture).not.toHaveBeenCalled()
      expect(stripe.paymentIntents.cancel).not.toHaveBeenCalled()
      expect(stripe.transfers.create).not.toHaveBeenCalled()

      // Payment row untouched (escrow remains 'held').
      const freshPayment = await prisma.payment.findUnique({ where: { id: payment.id } })
      expect(freshPayment?.escrowStatus).toBe('held')

      const freshDispute = await prisma.dispute.findUnique({ where: { id: dispute.id } })
      expect(freshDispute?.status).toBe('resolved')
      expect(freshDispute?.resolution).toBe('escalated')
    },
    TEST_TIMEOUT
  )

  it(
    'already-resolved dispute is idempotent (returns existing row, no Stripe call)',
    async () => {
      const admin = await createTestAdmin()
      const { booking, dispute } = await disputeScenario()
      await prisma.dispute.update({
        where: { id: dispute.id },
        data: { status: 'resolved', resolution: 'full_release_to_artist' },
      })

      await DisputeService.adminResolve({ id: admin.id, role: 'admin' }, booking.id, {
        resolution: 'full_refund_to_caster',
      })
      expect(stripe.paymentIntents.capture).not.toHaveBeenCalled()
      expect(stripe.paymentIntents.cancel).not.toHaveBeenCalled()
      expect(stripe.transfers.create).not.toHaveBeenCalled()
    },
    TEST_TIMEOUT
  )

  it(
    'non-admin caller is rejected with FORBIDDEN',
    async () => {
      const { booking, casterUser } = await disputeScenario()

      let caught: unknown
      try {
        await DisputeService.adminResolve({ id: casterUser.id, role: 'caster' }, booking.id, {
          resolution: 'full_release_to_artist',
        })
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('FORBIDDEN')
    },
    TEST_TIMEOUT
  )

  it(
    'third lifetime loss against an artist (full_refund_to_caster) fires the frivolous-dispute admin alert',
    async () => {
      const admin = await createTestAdmin()
      // Seed two prior 'full_refund_to_caster' resolutions against the SAME
      // artist. Each prior dispute needs its own (caster, booking) pair.
      const { artist } = await createTestArtist({ payoutsEnabled: true })

      for (let i = 0; i < 2; i++) {
        const { caster } = await createTestCaster()
        const job = await createTestJob({ casterId: caster.id })
        const bid = await createTestBid({ jobId: job.id, artistId: artist.id, status: 'accepted' })
        const booking = await createTestBooking({
          jobId: job.id,
          bidId: bid.id,
          casterId: caster.id,
          artistId: artist.id,
        })
        await createTestPayment({ bookingId: booking.id, escrowStatus: 'refunded' })
        await prisma.dispute.create({
          data: {
            bookingId: booking.id,
            raisedById: caster.id,
            raisedAgainstId: artist.id,
            reason: 'no-show',
            description: 'no-show',
            status: 'resolved',
            resolution: 'full_refund_to_caster',
            resolvedById: admin.id,
            resolvedAt: new Date(),
          },
        })
      }

      // Now build a fresh dispute and resolve it the same way — third loss.
      const { caster } = await createTestCaster()
      const job = await createTestJob({ casterId: caster.id })
      const bid = await createTestBid({ jobId: job.id, artistId: artist.id, status: 'accepted' })
      const booking = await createTestBooking({
        jobId: job.id,
        bidId: bid.id,
        casterId: caster.id,
        artistId: artist.id,
      })
      await createTestPayment({ bookingId: booking.id, escrowStatus: 'held' })
      await prisma.dispute.create({
        data: {
          bookingId: booking.id,
          raisedById: caster.id,
          raisedAgainstId: artist.id,
          reason: 'no-show',
          description: 'third strike',
          status: 'under_review',
        },
      })

      await DisputeService.adminResolve({ id: admin.id, role: 'admin' }, booking.id, {
        resolution: 'full_refund_to_caster',
      })
      // notifyAdmins is fire-and-forget. Poll briefly for the row.
      let adminAlert: { id: string } | null = null
      for (let i = 0; i < 20; i++) {
        adminAlert = await prisma.notification.findFirst({
          where: {
            userId: admin.id,
            title: 'Frivolous-dispute pattern',
            relatedEntityId: artist.id,
          },
          select: { id: true },
        })
        if (adminAlert) break
        await new Promise((r) => setTimeout(r, 100))
      }
      expect(adminAlert).not.toBeNull()
    },
    TEST_TIMEOUT
  )
})
