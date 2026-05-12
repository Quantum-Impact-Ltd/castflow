import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { app } from '../../src/index'
import { prisma } from '../../src/lib/prisma'
import {
  createBookingScenario,
  createTestArtist,
} from '../helpers/factories'
import { cleanupTestData } from '../helpers/cleanup'
import {
  resetStripeMockCalls,
  resetStripeMockState,
  seedConnectAccount,
  stripeMock,
  stripeMockState,
} from '../helpers/stripe-mock'

const TEST_TIMEOUT = 30_000

beforeAll(async () => {
  await cleanupTestData()
})
beforeEach(() => {
  resetStripeMockCalls()
  resetStripeMockState()
})
afterAll(async () => {
  await cleanupTestData()
}, 60_000)

/**
 * Push a synthetic Stripe event payload through `/webhooks/stripe`. The
 * mocked `stripe.webhooks.constructEvent` returns whatever is in
 * `stripeMockState.nextEvent` — we set that, then post with a dummy
 * `stripe-signature` so the route doesn't 400 on missing-header.
 */
async function postStripeEvent(event: Record<string, unknown>): Promise<Response> {
  stripeMockState.nextEvent = event as unknown as typeof stripeMockState.nextEvent
  return app.request('/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': 't=0,v1=fake' },
    body: JSON.stringify(event),
  })
}

describe('POST /webhooks/stripe — signature handling', () => {
  it(
    'rejects requests with no stripe-signature header with INVALID_SIGNATURE 400',
    async () => {
      const res = await app.request('/webhooks/stripe', {
        method: 'POST',
        body: '{}',
      })
      expect(res.status).toBe(400)
      const body = (await res.json()) as { error: { code: string } }
      expect(body.error.code).toBe('INVALID_SIGNATURE')
    },
    TEST_TIMEOUT
  )

  it(
    'rejects requests whose constructEvent throws with INVALID_SIGNATURE 400',
    async () => {
      stripeMockState.constructEventThrows = new Error('bad signature')
      const res = await app.request('/webhooks/stripe', {
        method: 'POST',
        headers: { 'stripe-signature': 't=0,v1=fake' },
        body: '{}',
      })
      expect(res.status).toBe(400)
      const body = (await res.json()) as { error: { code: string } }
      expect(body.error.code).toBe('INVALID_SIGNATURE')
    },
    TEST_TIMEOUT
  )
})

describe('POST /webhooks/stripe — event dispatch', () => {
  it(
    'payment_intent.succeeded → marks payment held + booking confirmed',
    async () => {
      const { booking, payment } = await createBookingScenario({
        artistPayoutsEnabled: true,
        escrowStatus: 'awaiting_payment',
      })

      const res = await postStripeEvent({
        id: 'evt_test_succeeded',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: payment.stripePaymentIntentId,
            latest_charge: 'ch_test_xyz',
          },
        },
      })
      expect(res.status).toBe(200)

      const freshPayment = await prisma.payment.findUnique({ where: { id: payment.id } })
      expect(freshPayment?.escrowStatus).toBe('held')
      expect(freshPayment?.stripeChargeId).toBe('ch_test_xyz')

      const freshBooking = await prisma.booking.findUnique({ where: { id: booking.id } })
      expect(freshBooking?.status).toBe('confirmed')
    },
    TEST_TIMEOUT
  )

  it(
    'payment_intent.canceled → marks payment refunded + booking cancelled',
    async () => {
      const { booking, payment } = await createBookingScenario({
        artistPayoutsEnabled: true,
        escrowStatus: 'held',
      })

      const res = await postStripeEvent({
        id: 'evt_test_canceled',
        type: 'payment_intent.canceled',
        data: { object: { id: payment.stripePaymentIntentId } },
      })
      expect(res.status).toBe(200)

      const freshPayment = await prisma.payment.findUnique({ where: { id: payment.id } })
      expect(freshPayment?.escrowStatus).toBe('refunded')
      const freshBooking = await prisma.booking.findUnique({ where: { id: booking.id } })
      expect(freshBooking?.status).toBe('cancelled')
    },
    TEST_TIMEOUT
  )

  it(
    'charge.refunded (full) → marks payment refunded + booking cancelled',
    async () => {
      const { booking, payment } = await createBookingScenario({
        artistPayoutsEnabled: true,
        escrowStatus: 'held',
      })

      const res = await postStripeEvent({
        id: 'evt_test_charge_refunded',
        type: 'charge.refunded',
        data: {
          object: {
            id: payment.stripeChargeId,
            amount: 100000,
            amount_refunded: 100000,
          },
        },
      })
      expect(res.status).toBe(200)

      const freshPayment = await prisma.payment.findUnique({ where: { id: payment.id } })
      expect(freshPayment?.escrowStatus).toBe('refunded')
      const freshBooking = await prisma.booking.findUnique({ where: { id: booking.id } })
      expect(freshBooking?.status).toBe('cancelled')
    },
    TEST_TIMEOUT
  )

  it(
    'charge.refunded (partial) → marks payment partially_refunded, booking unchanged',
    async () => {
      const { booking, payment } = await createBookingScenario({
        artistPayoutsEnabled: true,
        escrowStatus: 'held',
      })

      const res = await postStripeEvent({
        id: 'evt_test_charge_partial',
        type: 'charge.refunded',
        data: {
          object: {
            id: payment.stripeChargeId,
            amount: 100000,
            amount_refunded: 50000,
          },
        },
      })
      expect(res.status).toBe(200)

      const freshPayment = await prisma.payment.findUnique({ where: { id: payment.id } })
      expect(freshPayment?.escrowStatus).toBe('partially_refunded')
      const freshBooking = await prisma.booking.findUnique({ where: { id: booking.id } })
      expect(freshBooking?.status).toBe('confirmed') // unchanged
    },
    TEST_TIMEOUT
  )

  it(
    'charge.dispute.created → marks payment + booking disputed',
    async () => {
      const { booking, payment } = await createBookingScenario({
        artistPayoutsEnabled: true,
        escrowStatus: 'held',
      })

      const res = await postStripeEvent({
        id: 'evt_test_dispute',
        type: 'charge.dispute.created',
        data: {
          object: {
            id: 'dp_test_1',
            charge: payment.stripeChargeId,
          },
        },
      })
      expect(res.status).toBe(200)

      const freshPayment = await prisma.payment.findUnique({ where: { id: payment.id } })
      expect(freshPayment?.escrowStatus).toBe('disputed')
      const freshBooking = await prisma.booking.findUnique({ where: { id: booking.id } })
      expect(freshBooking?.status).toBe('disputed')
    },
    TEST_TIMEOUT
  )

  it(
    'account.updated → syncs the artist profile payoutsEnabled flag from Stripe',
    async () => {
      const accountId = `acct_test_${crypto.randomUUID()}`
      const { artist } = await createTestArtist({
        stripeAccountId: accountId,
        payoutsEnabled: false,
      })
      // Sanity: DB starts with payoutsEnabled false.
      expect(artist.payoutsEnabled).toBe(false)
      seedConnectAccount({ id: accountId, payoutsEnabled: true })

      const res = await postStripeEvent({
        id: 'evt_test_account_updated',
        type: 'account.updated',
        data: { object: { id: accountId, payouts_enabled: true } },
      })
      expect(res.status).toBe(200)

      const fresh = await prisma.artistProfile.findUnique({ where: { id: artist.id } })
      expect(fresh?.payoutsEnabled).toBe(true)
    },
    TEST_TIMEOUT
  )

  it(
    'account.application.deauthorized → clears the artist profile stripeAccountId + payoutsEnabled',
    async () => {
      const accountId = `acct_test_${crypto.randomUUID()}`
      const { artist } = await createTestArtist({
        stripeAccountId: accountId,
        payoutsEnabled: true,
      })

      const res = await postStripeEvent({
        id: 'evt_test_deauthorized',
        type: 'account.application.deauthorized',
        account: accountId,
        data: { object: { id: 'app_id_placeholder' } },
      })
      expect(res.status).toBe(200)

      const fresh = await prisma.artistProfile.findUnique({ where: { id: artist.id } })
      expect(fresh?.stripeAccountId).toBeNull()
      expect(fresh?.payoutsEnabled).toBe(false)
    },
    TEST_TIMEOUT
  )

  it(
    'unhandled event types return 200 without DB changes (no-op)',
    async () => {
      const { booking, payment } = await createBookingScenario({
        artistPayoutsEnabled: true,
        escrowStatus: 'held',
      })

      const res = await postStripeEvent({
        id: 'evt_test_ignored',
        type: 'invoice.paid',
        data: { object: { id: 'in_test_1' } },
      })
      expect(res.status).toBe(200)

      const freshPayment = await prisma.payment.findUnique({ where: { id: payment.id } })
      expect(freshPayment?.escrowStatus).toBe('held')
      const freshBooking = await prisma.booking.findUnique({ where: { id: booking.id } })
      expect(freshBooking?.status).toBe('confirmed')
    },
    TEST_TIMEOUT
  )

  it(
    'payment_intent.succeeded is idempotent — second delivery for the same intent is a no-op',
    async () => {
      const { payment } = await createBookingScenario({
        artistPayoutsEnabled: true,
        escrowStatus: 'awaiting_payment',
      })

      await postStripeEvent({
        id: 'evt_test_succeeded_1',
        type: 'payment_intent.succeeded',
        data: {
          object: { id: payment.stripePaymentIntentId, latest_charge: 'ch_a' },
        },
      })
      const afterFirst = await prisma.payment.findUnique({ where: { id: payment.id } })
      expect(afterFirst?.escrowStatus).toBe('held')
      const firstPaidAt = afterFirst?.paidAt
      // Stripe re-delivery for the same intent — should leave paidAt unchanged.
      await postStripeEvent({
        id: 'evt_test_succeeded_2',
        type: 'payment_intent.succeeded',
        data: {
          object: { id: payment.stripePaymentIntentId, latest_charge: 'ch_a' },
        },
      })
      const afterSecond = await prisma.payment.findUnique({ where: { id: payment.id } })
      expect(afterSecond?.escrowStatus).toBe('held')
      expect(afterSecond?.paidAt?.toISOString()).toBe(firstPaidAt?.toISOString())
    },
    TEST_TIMEOUT
  )
})
