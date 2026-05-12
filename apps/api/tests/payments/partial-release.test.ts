import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { PaymentService } from '../../src/services/PaymentService'
import { prisma } from '../../src/lib/prisma'
import { stripe } from '../../src/lib/stripe'
import { AppError } from '../../src/errors'
import { createBookingScenario } from '../helpers/factories'
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

describe('PaymentService.partialRelease', () => {
  it(
    'rejects capturePct <= 0 with INVALID_STATE before touching Stripe or DB',
    async () => {
      const { booking } = await createBookingScenario({
        artistPayoutsEnabled: true,
        escrowStatus: 'held',
      })

      let caught: unknown
      try {
        await PaymentService.partialRelease(booking.id, 0)
      } catch (err) {
        caught = err
      }
      expect(caught).toBeInstanceOf(AppError)
      expect((caught as AppError).code).toBe('INVALID_STATE')
      expect(stripe.paymentIntents.capture).not.toHaveBeenCalled()
    },
    TEST_TIMEOUT
  )

  it(
    'rejects capturePct >= 100 with INVALID_STATE (100 means full release, not partial)',
    async () => {
      const { booking } = await createBookingScenario({
        artistPayoutsEnabled: true,
        escrowStatus: 'held',
      })

      let caught: unknown
      try {
        await PaymentService.partialRelease(booking.id, 100)
      } catch (err) {
        caught = err
      }
      expect(caught).toBeInstanceOf(AppError)
      expect((caught as AppError).code).toBe('INVALID_STATE')

      let caught2: unknown
      try {
        await PaymentService.partialRelease(booking.id, 101)
      } catch (err) {
        caught2 = err
      }
      expect((caught2 as AppError).code).toBe('INVALID_STATE')
      expect(stripe.paymentIntents.capture).not.toHaveBeenCalled()
    },
    TEST_TIMEOUT
  )

  it(
    'throws PAYOUT_NOT_READY when artist has no Connect account; escrow stays held',
    async () => {
      const { booking, payment } = await createBookingScenario({
        artistStripeAccountId: null,
        escrowStatus: 'held',
      })

      let caught: unknown
      try {
        await PaymentService.partialRelease(booking.id, 50)
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('PAYOUT_NOT_READY')

      const fresh = await prisma.payment.findUnique({ where: { id: payment.id } })
      expect(fresh?.escrowStatus).toBe('held')
      expect(stripe.paymentIntents.capture).not.toHaveBeenCalled()
      expect(stripe.transfers.create).not.toHaveBeenCalled()
    },
    TEST_TIMEOUT
  )

  it(
    'captures 50% of gross, transfers commission-adjusted net, marks partially_refunded + booking cancelled',
    async () => {
      const { booking, payment, artist } = await createBookingScenario({
        artistPayoutsEnabled: true,
        escrowStatus: 'held',
        totalAmount: 1000, // £1000 gross → 50% capture = £500 = 50000 pence
      })

      const result = await PaymentService.partialRelease(booking.id, 50, {
        reason: 'late cancel',
        resolution: 'cancellation_fee',
      })

      // DB transitions
      expect(result.escrowStatus).toBe('partially_refunded')
      expect(Number(result.cancellationFeeAmount ?? 0)).toBe(500) // 50% of £1000

      const freshBooking = await prisma.booking.findUnique({ where: { id: booking.id } })
      expect(freshBooking?.status).toBe('cancelled')
      expect(freshBooking?.cancellationReason).toBe('late cancel')

      // Stripe: partial capture for £500 (50000 pence)
      expect(stripe.paymentIntents.capture).toHaveBeenCalledTimes(1)
      expect(stripe.paymentIntents.capture).toHaveBeenCalledWith(payment.stripePaymentIntentId, {
        amount_to_capture: 50000,
      })
      // Transfer: 50000 - (50000 * 15 / 100) = 50000 - 7500 = 42500 pence to artist
      const transferCall = stripeMockState.transfers.at(-1)
      expect(transferCall).toBeDefined()
      expect(transferCall?.amount).toBe(42500)
      expect(transferCall?.destination).toBe(artist.stripeAccountId)
      expect(transferCall?.metadata.resolution).toBe('cancellation_fee')
      expect(transferCall?.metadata.capturePct).toBe('50')
    },
    TEST_TIMEOUT
  )

  it(
    "split resolution (75/25) doesn't write cancellationFeeAmount but does mark partially_refunded",
    async () => {
      const { booking } = await createBookingScenario({
        artistPayoutsEnabled: true,
        escrowStatus: 'held',
        totalAmount: 800,
      })

      const result = await PaymentService.partialRelease(booking.id, 75, {
        resolution: 'split',
        reason: 'admin split',
      })

      expect(result.escrowStatus).toBe('partially_refunded')
      expect(result.cancellationFeeAmount).toBeNull()
      // 75% of 800 = 600 = 60000 pence; net = 60000 - 9000 = 51000
      const transferCall = stripeMockState.transfers.at(-1)
      expect(transferCall?.amount).toBe(51000)
      expect(transferCall?.metadata.resolution).toBe('split')
    },
    TEST_TIMEOUT
  )

  it(
    'rejects partial release on a non-held escrow with INVALID_STATE',
    async () => {
      const { booking } = await createBookingScenario({
        artistPayoutsEnabled: true,
        escrowStatus: 'released',
      })

      let caught: unknown
      try {
        await PaymentService.partialRelease(booking.id, 50)
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('INVALID_STATE')
      expect(stripe.paymentIntents.capture).not.toHaveBeenCalled()
    },
    TEST_TIMEOUT
  )
})
