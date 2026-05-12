import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { PaymentService } from '../../src/services/PaymentService'
import { prisma } from '../../src/lib/prisma'
import { stripe } from '../../src/lib/stripe'
import { AppError } from '../../src/errors'
import { createBookingScenario } from '../helpers/factories'
import { cleanupTestData } from '../helpers/cleanup'
import { resetStripeMockCalls, resetStripeMockState, stripeMockState } from '../helpers/stripe-mock'

const TEST_TIMEOUT = 30_000

// Cleanup once per file (in afterAll). Tests use randomUUID()-suffixed emails
// so cross-test data doesn't collide. Per-test cleanup over the remote
// alwaysdata Postgres exceeded Bun's hook timeout.
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

describe('PaymentService.releaseEscrow', () => {
  it(
    'throws PAYOUT_NOT_READY when the artist has no Stripe Connect account; escrow stays held',
    async () => {
      const { booking, payment } = await createBookingScenario({
        artistStripeAccountId: null,
        artistPayoutsEnabled: false,
        escrowStatus: 'held',
      })

      let caught: unknown
      try {
        await PaymentService.releaseEscrow(booking.id, { actor: 'caster' })
      } catch (err) {
        caught = err
      }
      expect(caught).toBeInstanceOf(AppError)
      expect((caught as AppError).code).toBe('PAYOUT_NOT_READY')

      const fresh = await prisma.payment.findUnique({ where: { id: payment.id } })
      expect(fresh?.escrowStatus).toBe('held')
      expect(stripe.paymentIntents.capture).not.toHaveBeenCalled()
      expect(stripe.transfers.create).not.toHaveBeenCalled()
    },
    TEST_TIMEOUT
  )

  it(
    'throws PAYOUT_NOT_READY when the artist has a Connect account but payouts disabled',
    async () => {
      const { booking } = await createBookingScenario({
        artistPayoutsEnabled: false,
        escrowStatus: 'held',
      })

      let caught: unknown
      try {
        await PaymentService.releaseEscrow(booking.id, { actor: 'caster' })
      } catch (err) {
        caught = err
      }
      expect(caught).toBeInstanceOf(AppError)
      expect((caught as AppError).code).toBe('PAYOUT_NOT_READY')
      expect(stripe.paymentIntents.capture).not.toHaveBeenCalled()
      expect(stripe.transfers.create).not.toHaveBeenCalled()
    },
    TEST_TIMEOUT
  )

  it(
    'happy path: captures intent + transfers commission-adjusted net to artist Connect, marks released',
    async () => {
      const { booking, payment, artist } = await createBookingScenario({
        artistPayoutsEnabled: true,
        escrowStatus: 'held',
        totalAmount: 1000,
      })

      const released = await PaymentService.releaseEscrow(booking.id, { actor: 'caster' })

      // DB transitions
      expect(released.escrowStatus).toBe('released')
      expect(released.releasedAt).toBeInstanceOf(Date)
      expect(released.stripeTransferId).toMatch(/^tr_/)

      const freshBooking = await prisma.booking.findUnique({ where: { id: booking.id } })
      expect(freshBooking?.status).toBe('completed')
      expect(freshBooking?.completionConfirmedAt).toBeInstanceOf(Date)

      // Stripe side effects: one capture, one transfer for the commission-net amount.
      // £1000 gross × 15% commission = £150; net = £850 = 85000 pence.
      expect(stripe.paymentIntents.capture).toHaveBeenCalledTimes(1)
      expect(stripe.paymentIntents.capture).toHaveBeenCalledWith(
        payment.stripePaymentIntentId,
        undefined,
        expect.objectContaining({ idempotencyKey: `capture-${payment.id}` })
      )
      expect(stripe.transfers.create).toHaveBeenCalledTimes(1)
      const transferCall = stripeMockState.transfers.at(-1)
      expect(transferCall).toBeDefined()
      expect(transferCall?.amount).toBe(85000)
      expect(transferCall?.destination).toBe(artist.stripeAccountId)
      expect(transferCall?.source_transaction).toBe(payment.stripeChargeId ?? undefined)
    },
    TEST_TIMEOUT
  )

  it(
    'idempotent: a second release call after success returns the row without re-calling Stripe',
    async () => {
      const { booking } = await createBookingScenario({
        artistPayoutsEnabled: true,
        escrowStatus: 'held',
      })

      const first = await PaymentService.releaseEscrow(booking.id, { actor: 'caster' })
      expect(first.escrowStatus).toBe('released')
      expect(stripe.paymentIntents.capture).toHaveBeenCalledTimes(1)
      expect(stripe.transfers.create).toHaveBeenCalledTimes(1)

      const second = await PaymentService.releaseEscrow(booking.id, { actor: 'caster' })
      expect(second.escrowStatus).toBe('released')
      expect(second.id).toBe(first.id)

      // Crucial: no duplicate Stripe calls on the second invocation.
      expect(stripe.paymentIntents.capture).toHaveBeenCalledTimes(1)
      expect(stripe.transfers.create).toHaveBeenCalledTimes(1)
    },
    TEST_TIMEOUT
  )

  it(
    'rejects release from a non-held state (e.g. awaiting_payment) with INVALID_STATE',
    async () => {
      const { booking } = await createBookingScenario({
        artistPayoutsEnabled: true,
        escrowStatus: 'awaiting_payment',
      })

      let caught: unknown
      try {
        await PaymentService.releaseEscrow(booking.id, { actor: 'caster' })
      } catch (err) {
        caught = err
      }
      expect(caught).toBeInstanceOf(AppError)
      expect((caught as AppError).code).toBe('INVALID_STATE')
      expect(stripe.paymentIntents.capture).not.toHaveBeenCalled()
    },
    TEST_TIMEOUT
  )
})
