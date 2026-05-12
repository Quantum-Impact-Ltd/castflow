import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { ReviewService } from '../../src/services/ReviewService'
import { prisma } from '../../src/lib/prisma'
import { AppError } from '../../src/errors'
import { createBookingScenario } from '../helpers/factories'
import { cleanupTestData } from '../helpers/cleanup'
import { resetStripeMockCalls, resetStripeMockState } from '../helpers/stripe-mock'

/**
 * Schema split: `Review.revieweeId` was replaced with `artistRevieweeId` +
 * `casterRevieweeId` (option A from the bug discussion). Exactly one is
 * non-null per row; each has its own FK to the relevant profile table. The
 * dual-FK violation that previously made `ReviewService.submit` unreachable
 * is fixed, and the formerly-skipped insert paths are exercised below.
 */

const TEST_TIMEOUT = 30_000
const DAY_MS = 24 * 60 * 60 * 1000

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

async function completedBookingShotDaysAgo(daysAgo: number, totalAmount = 500) {
  const shootDate = new Date(Date.now() - daysAgo * DAY_MS)
  return createBookingScenario({
    artistPayoutsEnabled: true,
    bookingStatus: 'completed',
    escrowStatus: 'released',
    totalAmount,
    shootDate,
  })
}

describe('ReviewService.submit — submission window', () => {
  it(
    'rejects reviews submitted BEFORE the 14d window opens (INVALID_STATE)',
    async () => {
      const { booking, casterUser } = await completedBookingShotDaysAgo(7)

      let caught: unknown
      try {
        await ReviewService.submit(
          { id: casterUser.id, role: 'caster' },
          booking.id,
          { rating: 5, comment: 'too early' }
        )
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('INVALID_STATE')
    },
    TEST_TIMEOUT
  )

  it(
    'rejects reviews submitted AFTER the 28d window closes (INVALID_STATE)',
    async () => {
      const { booking, casterUser } = await completedBookingShotDaysAgo(30)

      let caught: unknown
      try {
        await ReviewService.submit(
          { id: casterUser.id, role: 'caster' },
          booking.id,
          { rating: 5, comment: 'too late' }
        )
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('INVALID_STATE')
    },
    TEST_TIMEOUT
  )

  it(
    'rejects reviews on non-completed bookings (INVALID_STATE)',
    async () => {
      const { booking, casterUser } = await createBookingScenario({
        artistPayoutsEnabled: true,
        bookingStatus: 'confirmed',
        shootDate: new Date(Date.now() - 20 * DAY_MS),
      })

      let caught: unknown
      try {
        await ReviewService.submit(
          { id: casterUser.id, role: 'caster' },
          booking.id,
          { rating: 5 }
        )
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('INVALID_STATE')
    },
    TEST_TIMEOUT
  )

  it(
    'rejects admin submissions with FORBIDDEN (admins do not author reviews)',
    async () => {
      const { booking } = await completedBookingShotDaysAgo(20)

      let caught: unknown
      try {
        await ReviewService.submit(
          { id: 'admin-id', role: 'admin' },
          booking.id,
          { rating: 5 }
        )
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('FORBIDDEN')
    },
    TEST_TIMEOUT
  )

  it(
    'rejects non-party reviewer with FORBIDDEN',
    async () => {
      const { booking } = await completedBookingShotDaysAgo(20)
      const outsider = await createBookingScenario({ artistPayoutsEnabled: true })

      let caught: unknown
      try {
        await ReviewService.submit(
          { id: outsider.casterUser.id, role: 'caster' },
          booking.id,
          { rating: 5 }
        )
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('FORBIDDEN')
    },
    TEST_TIMEOUT
  )
})

// ── Insert-path tests (formerly blocked by the dual-FK schema bug) ──────

describe('ReviewService.submit — successful insert paths', () => {
  it(
    'caster review of artist: populates artistRevieweeId, leaves casterRevieweeId null',
    async () => {
      const { booking, casterUser, artist } = await completedBookingShotDaysAgo(20)
      const review = await ReviewService.submit(
        { id: casterUser.id, role: 'caster' },
        booking.id,
        { rating: 5, comment: 'great' }
      )
      expect(review.rating).toBe(5)
      expect(review.artistRevieweeId).toBe(artist.id)
      expect(review.casterRevieweeId).toBeNull()
      expect(review.reviewerRole).toBe('caster')
    },
    TEST_TIMEOUT
  )

  it(
    'artist review of caster: populates casterRevieweeId, leaves artistRevieweeId null',
    async () => {
      const { booking, artistUser, caster } = await completedBookingShotDaysAgo(20)
      const review = await ReviewService.submit(
        { id: artistUser.id, role: 'artist' },
        booking.id,
        { rating: 4, comment: 'easy to work with' }
      )
      expect(review.casterRevieweeId).toBe(caster.id)
      expect(review.artistRevieweeId).toBeNull()
      expect(review.reviewerRole).toBe('artist')
    },
    TEST_TIMEOUT
  )

  it(
    'caster + artist can each review the same booking once',
    async () => {
      const { booking, casterUser, artistUser } = await completedBookingShotDaysAgo(20)
      const c = await ReviewService.submit(
        { id: casterUser.id, role: 'caster' },
        booking.id,
        { rating: 4 }
      )
      const a = await ReviewService.submit(
        { id: artistUser.id, role: 'artist' },
        booking.id,
        { rating: 5 }
      )
      expect(c.id).not.toBe(a.id)
      expect(c.artistRevieweeId).not.toBeNull()
      expect(a.casterRevieweeId).not.toBeNull()
    },
    TEST_TIMEOUT
  )

  it(
    'rejects duplicate reviewer on same booking with INVALID_STATE',
    async () => {
      const { booking, casterUser } = await completedBookingShotDaysAgo(20)
      await ReviewService.submit(
        { id: casterUser.id, role: 'caster' },
        booking.id,
        { rating: 4 }
      )
      let caught: unknown
      try {
        await ReviewService.submit(
          { id: casterUser.id, role: 'caster' },
          booking.id,
          { rating: 5 }
        )
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('INVALID_STATE')
    },
    TEST_TIMEOUT
  )
})

describe('ReviewService — ratings cache', () => {
  it(
    'incrementally updates artist ratingAvg + ratingCount on caster review',
    async () => {
      const { booking, casterUser, artist } = await completedBookingShotDaysAgo(20)
      await prisma.artistProfile.update({
        where: { id: artist.id },
        data: { ratingAvg: 4.0, ratingCount: 3 },
      })
      await ReviewService.submit(
        { id: casterUser.id, role: 'caster' },
        booking.id,
        { rating: 5 }
      )
      const fresh = await prisma.artistProfile.findUnique({ where: { id: artist.id } })
      expect(fresh?.ratingCount).toBe(4)
      // ((4.0 × 3) + 5) / 4 = 4.25 — Decimal(2,1) rounds to 4.2 or 4.3.
      const newAvg = Number(fresh?.ratingAvg ?? 0)
      expect(newAvg).toBeGreaterThanOrEqual(4.2)
      expect(newAvg).toBeLessThanOrEqual(4.3)
    },
    TEST_TIMEOUT
  )

  it(
    'incrementally updates caster ratingAvg + ratingCount on artist review',
    async () => {
      const { booking, artistUser, caster } = await completedBookingShotDaysAgo(20)
      await prisma.casterProfile.update({
        where: { id: caster.id },
        data: { ratingAvg: 5.0, ratingCount: 1 },
      })
      await ReviewService.submit(
        { id: artistUser.id, role: 'artist' },
        booking.id,
        { rating: 3 }
      )
      const fresh = await prisma.casterProfile.findUnique({ where: { id: caster.id } })
      expect(fresh?.ratingCount).toBe(2)
      // (5 × 1 + 3) / 2 = 4.0
      expect(Number(fresh?.ratingAvg ?? 0)).toBe(4)
    },
    TEST_TIMEOUT
  )

  it(
    'first review on a fresh artist sets ratingAvg to the submitted rating exactly',
    async () => {
      const { booking, casterUser, artist } = await completedBookingShotDaysAgo(20)
      await ReviewService.submit(
        { id: casterUser.id, role: 'caster' },
        booking.id,
        { rating: 4 }
      )
      const fresh = await prisma.artistProfile.findUnique({ where: { id: artist.id } })
      expect(fresh?.ratingCount).toBe(1)
      expect(Number(fresh?.ratingAvg ?? 0)).toBe(4)
    },
    TEST_TIMEOUT
  )
})

describe('ReviewService.listForArtist / listForCaster', () => {
  it(
    'listForArtist returns caster→artist reviews scoped to that artist profile',
    async () => {
      const { booking, casterUser, artist } = await completedBookingShotDaysAgo(20)
      await ReviewService.submit(
        { id: casterUser.id, role: 'caster' },
        booking.id,
        { rating: 5, comment: 'lovely' }
      )

      const rows = await ReviewService.listForArtist(artist.id)
      expect(rows.length).toBe(1)
      expect(rows[0]?.artistRevieweeId).toBe(artist.id)
      expect(rows[0]?.casterRevieweeId).toBeNull()
    },
    TEST_TIMEOUT
  )

  it(
    'listForCaster returns artist→caster reviews scoped to that caster profile',
    async () => {
      const { booking, artistUser, caster } = await completedBookingShotDaysAgo(20)
      await ReviewService.submit(
        { id: artistUser.id, role: 'artist' },
        booking.id,
        { rating: 5 }
      )

      const rows = await ReviewService.listForCaster(caster.id)
      expect(rows.length).toBe(1)
      expect(rows[0]?.casterRevieweeId).toBe(caster.id)
      expect(rows[0]?.artistRevieweeId).toBeNull()
    },
    TEST_TIMEOUT
  )
})
