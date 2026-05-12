import { Hono } from 'hono'
import type Stripe from 'stripe'
import { stripe } from '../lib/stripe'
import { env } from '../lib/env'
import { PaymentService } from '../services/PaymentService'

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

  switch (event.type) {
    case 'payment_intent.amount_capturable_updated':
    case 'payment_intent.succeeded': {
      const intent = event.data.object
      const chargeId =
        typeof intent.latest_charge === 'string'
          ? intent.latest_charge
          : (intent.latest_charge?.id ?? null)
      await PaymentService.markEscrowHeld(intent.id, chargeId)
      break
    }
    case 'payment_intent.payment_failed': {
      const intent = event.data.object
      console.error(
        '[stripe] payment_intent.payment_failed',
        intent.id,
        intent.last_payment_error?.message
      )
      break
    }
    case 'payment_intent.canceled': {
      const intent = event.data.object
      await PaymentService.markCanceledByIntent(intent.id)
      break
    }
    case 'charge.refunded': {
      const charge = event.data.object
      const fullyRefunded = charge.amount_refunded >= charge.amount
      await PaymentService.markRefundedByCharge(charge.id, fullyRefunded)
      break
    }
    case 'charge.dispute.created': {
      const dispute = event.data.object
      const chargeId =
        typeof dispute.charge === 'string' ? dispute.charge : (dispute.charge?.id ?? null)
      if (chargeId) {
        await PaymentService.markDisputedByCharge(chargeId)
      }
      break
    }
    case 'account.updated': {
      // Connect Express account state changed — keep the cached
      // payoutsEnabled flag in sync so releaseEscrow can gate without an RPC.
      const account = event.data.object
      await PaymentService.syncConnectAccountStatus({
        id: account.id,
        payouts_enabled: account.payouts_enabled,
      })
      break
    }
    case 'account.application.deauthorized': {
      // Artist revoked our Connect access from the Stripe dashboard.
      // Clear the binding so future releases throw PAYOUT_NOT_READY.
      const account = event.account ?? event.data.object.id
      if (typeof account === 'string') {
        await PaymentService.clearConnectAccount(account)
      }
      break
    }
    default:
      // Ignore unhandled types for now; record-only later if needed.
      break
  }

  return c.json({ success: true, data: { received: true } })
})
