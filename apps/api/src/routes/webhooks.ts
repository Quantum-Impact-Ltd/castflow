import { Hono } from 'hono'
import type Stripe from 'stripe'
import { stripe } from '../lib/stripe'
import { env } from '../lib/env'
import { SubscriptionService } from '../services/SubscriptionService'

export const webhookRoutes = new Hono()

webhookRoutes.post('/stripe', async (c) => {
  const sig = c.req.header('stripe-signature')
  if (!sig) {
    return c.json(
      { success: false, error: { code: 'INVALID_SIGNATURE', message: 'Missing signature' } },
      400
    )
  }

  // Raw body required for signature verification — Hono gives us text.
  const raw = await c.req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(raw, sig, env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('[stripe] invalid signature:', (err as Error).message)
    return c.json(
      { success: false, error: { code: 'INVALID_SIGNATURE', message: 'Bad signature' } },
      400
    )
  }

  // Caster subscription billing is the only money flow on the platform. Job
  // fees are settled off-platform, so there are no payment-intent/charge/
  // Connect events to handle here.
  switch (event.type) {
    case 'checkout.session.completed': {
      await SubscriptionService.handleCheckoutCompleted(event.data.object)
      break
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      await SubscriptionService.handleSubscriptionUpserted(event.data.object)
      break
    }
    case 'invoice.payment_failed': {
      await SubscriptionService.handleInvoicePaymentFailed(event.data.object)
      break
    }
    default:
      // Ignore unhandled types.
      break
  }

  return c.json({ success: true, data: { received: true } })
})
