import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { BookingService } from '../../src/services/BookingService'
import { prisma } from '../../src/lib/prisma'
import { stripe } from '../../src/lib/stripe'
import { AppError } from '../../src/errors'
import { createBookingScenario, createTestAdmin } from '../helpers/factories'
import { cleanupTestData } from '../helpers/cleanup'
import { resetStripeMockCalls, resetStripeMockState, stripeMockState } from '../helpers/stripe-mock'

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

describe('BookingService.cancel', () => {
  it(
    'rejects empty/short reason with VALIDATION_ERROR',
    async () => {
      const { booking, artistUser } = await createBookingScenario({
        artistPayoutsEnabled: true,
      })

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
    'artist cancelling >7d ahead: no fee, full refund via refundEscrow, no strike',
    async () => {
      const { booking, artistUser, artist } = await createBookingScenario({
        artistPayoutsEnabled: true,
        shootDate: new Date(Date.now() + 14 * DAY_MS),
      })

      await BookingService.cancel(
        { id: artistUser.id, role: 'artist' },
        booking.id,
        'schedule conflict'
      )

      const fresh = await prisma.payment.findUnique({ where: { bookingId: booking.id } })
      expect(fresh?.escrowStatus).toBe('refunded')
      // Refund path uses paymentIntents.cancel, NOT capture or transfer.
      expect(stripe.paymentIntents.cancel).toHaveBeenCalledTimes(1)
      expect(stripe.paymentIntents.capture).not.toHaveBeenCalled()
      expect(stripe.transfers.create).not.toHaveBeenCalled()

      const freshArtist = await prisma.artistProfile.findUnique({ where: { id: artist.id } })
      expect(freshArtist?.strikeCount).toBe(0)
    },
    TEST_TIMEOUT
  )

  it(
    'artist cancelling under 48h: partialRelease(50, cancellation_fee) + strike increment',
    async () => {
      const { booking, artistUser, artist } = await createBookingScenario({
        artistPayoutsEnabled: true,
        shootDate: new Date(Date.now() + 24 * HOUR_MS), // 24h ahead
        totalAmount: 1000,
      })

      await BookingService.cancel(
        { id: artistUser.id, role: 'artist' },
        booking.id,
        'cant make it'
      )

      const fresh = await prisma.payment.findUnique({ where: { bookingId: booking.id } })
      expect(fresh?.escrowStatus).toBe('partially_refunded')
      expect(Number(fresh?.cancellationFeeAmount ?? 0)).toBe(500)

      // Partial capture of 50% of £1000 → 50000 pence
      expect(stripe.paymentIntents.capture).toHaveBeenCalledWith(fresh?.stripePaymentIntentId, {
        amount_to_capture: 50000,
      })
      const transferCall = stripeMockState.transfers.at(-1)
      expect(transferCall?.amount).toBe(42500) // 50000 - 15% commission
      expect(transferCall?.metadata.resolution).toBe('cancellation_fee')

      const freshArtist = await prisma.artistProfile.findUnique({ where: { id: artist.id } })
      expect(freshArtist?.strikeCount).toBe(1)
    },
    TEST_TIMEOUT
  )

  it(
    'artist cancelling under 48h but NOT Connect-ready: falls back to full refund + cancellationFeeAmount recorded',
    async () => {
      const { booking, artistUser, artist } = await createBookingScenario({
        artistStripeAccountId: null, // not onboarded → PAYOUT_NOT_READY
        shootDate: new Date(Date.now() + 24 * HOUR_MS),
        totalAmount: 1000,
      })

      await BookingService.cancel(
        { id: artistUser.id, role: 'artist' },
        booking.id,
        'cant make it'
      )

      const fresh = await prisma.payment.findUnique({ where: { bookingId: booking.id } })
      // Full refund path (paymentIntents.cancel), with the fee amount persisted
      // for admin reconciliation.
      expect(fresh?.escrowStatus).toBe('refunded')
      expect(Number(fresh?.cancellationFeeAmount ?? 0)).toBe(500)
      expect(stripe.paymentIntents.cancel).toHaveBeenCalledTimes(1)
      expect(stripe.paymentIntents.capture).not.toHaveBeenCalled()
      expect(stripe.transfers.create).not.toHaveBeenCalled()

      // Strike still increments — the artist cancelled inside the late window,
      // independent of whether the Stripe fee capture went through.
      const freshArtist = await prisma.artistProfile.findUnique({ where: { id: artist.id } })
      expect(freshArtist?.strikeCount).toBe(1)
    },
    TEST_TIMEOUT
  )

  it(
    'caster cancelling >48h ahead: full refund, no fee, no strike on artist',
    async () => {
      const { booking, casterUser, artist } = await createBookingScenario({
        artistPayoutsEnabled: true,
        shootDate: new Date(Date.now() + 10 * DAY_MS),
      })

      await BookingService.cancel(
        { id: casterUser.id, role: 'caster' },
        booking.id,
        'shoot delayed'
      )

      const fresh = await prisma.payment.findUnique({ where: { bookingId: booking.id } })
      expect(fresh?.escrowStatus).toBe('refunded')
      expect(fresh?.cancellationFeeAmount).toBeNull()

      const freshArtist = await prisma.artistProfile.findUnique({ where: { id: artist.id } })
      expect(freshArtist?.strikeCount).toBe(0)
    },
    TEST_TIMEOUT
  )

  it(
    'caster cancelling under 48h: partialRelease(50, cancellation_fee) to artist, no strike',
    async () => {
      const { booking, casterUser, artist } = await createBookingScenario({
        artistPayoutsEnabled: true,
        shootDate: new Date(Date.now() + 12 * HOUR_MS),
        totalAmount: 600,
      })

      await BookingService.cancel(
        { id: casterUser.id, role: 'caster' },
        booking.id,
        'shoot fell through'
      )

      const fresh = await prisma.payment.findUnique({ where: { bookingId: booking.id } })
      expect(fresh?.escrowStatus).toBe('partially_refunded')
      expect(Number(fresh?.cancellationFeeAmount ?? 0)).toBe(300)

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
        artistPayoutsEnabled: true,
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
    'cancelling an already-cancelled booking is idempotent (returns the row, no Stripe call)',
    async () => {
      const { booking, casterUser } = await createBookingScenario({
        artistPayoutsEnabled: true,
        bookingStatus: 'cancelled',
        escrowStatus: 'refunded',
      })

      const result = await BookingService.cancel(
        { id: casterUser.id, role: 'caster' },
        booking.id,
        'already cancelled'
      )
      expect(result.id).toBe(booking.id)
      expect(stripe.paymentIntents.cancel).not.toHaveBeenCalled()
      expect(stripe.paymentIntents.capture).not.toHaveBeenCalled()
    },
    TEST_TIMEOUT
  )

  it(
    'cancelling a completed booking throws INVALID_STATE',
    async () => {
      const { booking, casterUser } = await createBookingScenario({
        artistPayoutsEnabled: true,
        bookingStatus: 'completed',
        escrowStatus: 'released',
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
