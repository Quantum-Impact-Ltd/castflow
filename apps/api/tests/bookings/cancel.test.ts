import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { BookingService } from '../../src/services/BookingService'
import { prisma } from '../../src/lib/prisma'
import { AppError } from '../../src/errors'
import { createBookingScenario, createTestAdmin } from '../helpers/factories'
import { cleanupTestData } from '../helpers/cleanup'
import { resetStripeMockCalls, resetStripeMockState } from '../helpers/stripe-mock'

const TEST_TIMEOUT = 30_000
const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

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
 * Cancellation no longer moves money — the platform holds no job funds. The
 * tiers still compute, but they only drive advisory messaging + the artist
 * strike system. These tests assert booking state + strike behaviour only.
 */
describe('BookingService.cancel', () => {
  it(
    'rejects empty/short reason with VALIDATION_ERROR',
    async () => {
      const { booking, artistUser } = await createBookingScenario()

      let caught: unknown
      try {
        await BookingService.cancel({ id: artistUser.id, role: 'artist' }, booking.id, '')
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('VALIDATION_ERROR')
    },
    TEST_TIMEOUT
  )

  it(
    'artist cancelling >7d ahead: booking cancelled, no strike',
    async () => {
      const { booking, artistUser, artist } = await createBookingScenario({
        shootDate: new Date(Date.now() + 14 * DAY_MS),
      })

      await BookingService.cancel(
        { id: artistUser.id, role: 'artist' },
        booking.id,
        'schedule conflict'
      )

      const fresh = await prisma.booking.findUnique({ where: { id: booking.id } })
      expect(fresh?.status).toBe('cancelled')
      expect(fresh?.cancelledBy).toBe('artist')
      expect(fresh?.cancellationReason).toBe('schedule conflict')

      const freshArtist = await prisma.artistProfile.findUnique({ where: { id: artist.id } })
      expect(freshArtist?.strikeCount).toBe(0)
    },
    TEST_TIMEOUT
  )

  it(
    'artist cancelling under 48h: booking cancelled + strike increment',
    async () => {
      const { booking, artistUser, artist } = await createBookingScenario({
        shootDate: new Date(Date.now() + 24 * HOUR_MS), // 24h ahead
        totalAmount: 1000,
      })

      await BookingService.cancel(
        { id: artistUser.id, role: 'artist' },
        booking.id,
        'cant make it'
      )

      const fresh = await prisma.booking.findUnique({ where: { id: booking.id } })
      expect(fresh?.status).toBe('cancelled')
      expect(fresh?.cancelledBy).toBe('artist')

      const freshArtist = await prisma.artistProfile.findUnique({ where: { id: artist.id } })
      expect(freshArtist?.strikeCount).toBe(1)
    },
    TEST_TIMEOUT
  )

  it(
    'caster cancelling >48h ahead: booking cancelled, no strike on artist',
    async () => {
      const { booking, casterUser, artist } = await createBookingScenario({
        shootDate: new Date(Date.now() + 10 * DAY_MS),
      })

      await BookingService.cancel(
        { id: casterUser.id, role: 'caster' },
        booking.id,
        'shoot delayed'
      )

      const fresh = await prisma.booking.findUnique({ where: { id: booking.id } })
      expect(fresh?.status).toBe('cancelled')
      expect(fresh?.cancelledBy).toBe('caster')

      const freshArtist = await prisma.artistProfile.findUnique({ where: { id: artist.id } })
      expect(freshArtist?.strikeCount).toBe(0)
    },
    TEST_TIMEOUT
  )

  it(
    'caster cancelling under 48h: booking cancelled, no strike on artist',
    async () => {
      const { booking, casterUser, artist } = await createBookingScenario({
        shootDate: new Date(Date.now() + 12 * HOUR_MS),
        totalAmount: 600,
      })

      await BookingService.cancel(
        { id: casterUser.id, role: 'caster' },
        booking.id,
        'shoot fell through'
      )

      const fresh = await prisma.booking.findUnique({ where: { id: booking.id } })
      expect(fresh?.status).toBe('cancelled')

      // Caster cancelling does NOT increment strike on the artist.
      const freshArtist = await prisma.artistProfile.findUnique({ where: { id: artist.id } })
      expect(freshArtist?.strikeCount).toBe(0)
    },
    TEST_TIMEOUT
  )

  it(
    'third late-cancel strike notifies admins (admin notification row created)',
    async () => {
      const admin = await createTestAdmin()
      // Seed the artist with 2 prior strikes so the next late cancel hits 3.
      const { booking, artistUser, artist } = await createBookingScenario({
        shootDate: new Date(Date.now() + 12 * HOUR_MS),
      })
      await prisma.artistProfile.update({
        where: { id: artist.id },
        data: { strikeCount: 2 },
      })

      await BookingService.cancel(
        { id: artistUser.id, role: 'artist' },
        booking.id,
        'last minute drop'
      )

      // notifyAdmins is fire-and-forget — give the microtask + DB write a beat.
      await new Promise((r) => setTimeout(r, 250))

      const fresh = await prisma.artistProfile.findUnique({ where: { id: artist.id } })
      expect(fresh?.strikeCount).toBe(3)

      const adminNotif = await prisma.notification.findFirst({
        where: { userId: admin.id, title: '3-strike review required' },
      })
      expect(adminNotif).not.toBeNull()
    },
    TEST_TIMEOUT
  )

  it(
    'cancelling an already-cancelled booking is idempotent (returns the row)',
    async () => {
      const { booking, casterUser } = await createBookingScenario({
        bookingStatus: 'cancelled',
      })

      const result = await BookingService.cancel(
        { id: casterUser.id, role: 'caster' },
        booking.id,
        'already cancelled'
      )
      expect(result.id).toBe(booking.id)
    },
    TEST_TIMEOUT
  )

  it(
    'cancelling a completed booking throws INVALID_STATE',
    async () => {
      const { booking, casterUser } = await createBookingScenario({
        bookingStatus: 'completed',
      })

      let caught: unknown
      try {
        await BookingService.cancel(
          { id: casterUser.id, role: 'caster' },
          booking.id,
          'too late'
        )
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('INVALID_STATE')
    },
    TEST_TIMEOUT
  )
})
