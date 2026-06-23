import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { DisputeService } from '../../src/services/DisputeService'
import { prisma } from '../../src/lib/prisma'
import { AppError } from '../../src/errors'
import {
  createBookingScenario,
  createTestAdmin,
  createTestArtist,
  createTestCaster,
  createTestBid,
  createTestBooking,
  createTestJob,
} from '../helpers/factories'
import { cleanupTestData } from '../helpers/cleanup'
import { resetStripeMockCalls, resetStripeMockState } from '../helpers/stripe-mock'

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
 * Dispute resolution is RECORD-ONLY now — the platform holds no job money, so
 * there is no capture / transfer / refund. Resolution documents the admin's
 * decision (and the agreed artist share for `split`), writes an AdminLog,
 * notifies both parties, and transitions the booking:
 *   full_refund_to_caster → cancelled
 *   full_release_to_artist | split → completed
 *   escalated → stays disputed
 */
async function disputeScenario(opts: { totalAmount?: number } = {}) {
  const scenario = await createBookingScenario({
    bookingStatus: 'disputed',
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
    'full_release_to_artist → dispute resolved, booking completed, AdminLog written',
    async () => {
      const admin = await createTestAdmin()
      const { booking } = await disputeScenario({ totalAmount: 1000 })

      await DisputeService.adminResolve({ id: admin.id, role: 'admin' }, booking.id, {
        resolution: 'full_release_to_artist',
        adminNotes: 'no-show not substantiated, full release',
      })

      const freshDispute = await prisma.dispute.findUnique({ where: { bookingId: booking.id } })
      expect(freshDispute?.status).toBe('resolved')
      expect(freshDispute?.resolution).toBe('full_release_to_artist')
      expect(freshDispute?.resolvedById).toBe(admin.id)
      expect(freshDispute?.adminNotes).toBe('no-show not substantiated, full release')

      const freshBooking = await prisma.booking.findUnique({ where: { id: booking.id } })
      expect(freshBooking?.status).toBe('completed')

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
    'full_refund_to_caster → dispute resolved, booking cancelled',
    async () => {
      const admin = await createTestAdmin()
      const { booking } = await disputeScenario()

      await DisputeService.adminResolve({ id: admin.id, role: 'admin' }, booking.id, {
        resolution: 'full_refund_to_caster',
        adminNotes: 'artist breached terms',
      })

      const freshDispute = await prisma.dispute.findUnique({ where: { bookingId: booking.id } })
      expect(freshDispute?.status).toBe('resolved')
      expect(freshDispute?.resolution).toBe('full_refund_to_caster')

      const freshBooking = await prisma.booking.findUnique({ where: { id: booking.id } })
      expect(freshBooking?.status).toBe('cancelled')
    },
    TEST_TIMEOUT
  )

  it(
    'split with splitArtistPct=70 → persists splitArtistPct, booking completed',
    async () => {
      const admin = await createTestAdmin()
      const { booking, dispute } = await disputeScenario({ totalAmount: 1000 })

      await DisputeService.adminResolve({ id: admin.id, role: 'admin' }, booking.id, {
        resolution: 'split',
        splitArtistPct: 70,
      })

      const freshDispute = await prisma.dispute.findUnique({ where: { id: dispute.id } })
      expect(freshDispute?.status).toBe('resolved')
      expect(freshDispute?.resolution).toBe('split')
      expect(freshDispute?.splitArtistPct).toBe(70)

      const freshBooking = await prisma.booking.findUnique({ where: { id: booking.id } })
      expect(freshBooking?.status).toBe('completed')
    },
    TEST_TIMEOUT
  )

  it(
    'escalated → dispute marked resolved, booking stays disputed',
    async () => {
      const admin = await createTestAdmin()
      const { booking, dispute } = await disputeScenario()

      await DisputeService.adminResolve({ id: admin.id, role: 'admin' }, booking.id, {
        resolution: 'escalated',
        adminNotes: 'kicking to external mediator',
      })

      const freshDispute = await prisma.dispute.findUnique({ where: { id: dispute.id } })
      expect(freshDispute?.status).toBe('resolved')
      expect(freshDispute?.resolution).toBe('escalated')

      const freshBooking = await prisma.booking.findUnique({ where: { id: booking.id } })
      expect(freshBooking?.status).toBe('disputed')
    },
    TEST_TIMEOUT
  )

  it(
    'already-resolved dispute is idempotent (returns existing row)',
    async () => {
      const admin = await createTestAdmin()
      const { booking, dispute } = await disputeScenario()
      await prisma.dispute.update({
        where: { id: dispute.id },
        data: { status: 'resolved', resolution: 'full_release_to_artist' },
      })

      const result = await DisputeService.adminResolve(
        { id: admin.id, role: 'admin' },
        booking.id,
        { resolution: 'full_refund_to_caster' }
      )
      // Returned row keeps its original resolution — the second call is a no-op.
      expect(result.resolution).toBe('full_release_to_artist')
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
      const { artist } = await createTestArtist()

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
        status: 'disputed',
      })
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
