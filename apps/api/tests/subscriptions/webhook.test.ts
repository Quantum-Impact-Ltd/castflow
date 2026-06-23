import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import type Stripe from 'stripe'
import { SubscriptionService } from '../../src/services/SubscriptionService'
import { prisma } from '../../src/lib/prisma'
import { createTestCaster } from '../helpers/factories'
import { cleanupTestData } from '../helpers/cleanup'

const TEST_TIMEOUT = 60_000

beforeAll(async () => {
  await cleanupTestData()
}, 60_000)
afterAll(async () => {
  await cleanupTestData()
}, 60_000)

/** Read back the Stripe customer id the factory assigned to a caster. */
async function customerIdFor(casterId: string): Promise<string> {
  const sub = await prisma.casterSubscription.findUniqueOrThrow({ where: { casterId } })
  return sub.stripeCustomerId
}

describe('Subscription webhook handlers', () => {
  it(
    'customer.subscription.updated syncs status + currentPeriodEnd',
    async () => {
      const { caster } = await createTestCaster()
      const customerId = await customerIdFor(caster.id)
      const periodEnd = Math.floor((Date.now() + 60 * 24 * 60 * 60 * 1000) / 1000)

      const sub = {
        id: `sub_test_${caster.id}`,
        customer: customerId,
        status: 'active',
        cancel_at_period_end: true,
        current_period_end: periodEnd,
        items: { data: [{ price: { id: 'price_test_monthly' } }] },
      } as unknown as Stripe.Subscription

      await SubscriptionService.handleSubscriptionUpserted(sub)

      const row = await prisma.casterSubscription.findUniqueOrThrow({
        where: { casterId: caster.id },
      })
      expect(row.status).toBe('active')
      expect(row.cancelAtPeriodEnd).toBe(true)
      expect(row.priceId).toBe('price_test_monthly')
      expect(Math.floor((row.currentPeriodEnd?.getTime() ?? 0) / 1000)).toBe(periodEnd)
    },
    TEST_TIMEOUT
  )

  it(
    'invoice.payment_failed moves the subscription to past_due',
    async () => {
      const { caster } = await createTestCaster()
      const customerId = await customerIdFor(caster.id)

      const invoice = { customer: customerId } as unknown as Stripe.Invoice
      await SubscriptionService.handleInvoicePaymentFailed(invoice)

      const row = await prisma.casterSubscription.findUniqueOrThrow({
        where: { casterId: caster.id },
      })
      expect(row.status).toBe('past_due')
    },
    TEST_TIMEOUT
  )
})
