import { Hono } from 'hono'
import { authenticate } from '../middleware/authenticate'
import { requireRole } from '../middleware/requireRole'
import { SubscriptionService } from '../services/SubscriptionService'

type AppEnv = { Variables: { user: { id: string; role: string } } }

export const subscriptionRoutes = new Hono<AppEnv>()

// Start a Stripe Checkout session for the caster subscription. Frontend
// redirects the caster to `url`.
subscriptionRoutes.post('/checkout', authenticate, requireRole('caster'), async (c) => {
  const user = c.get('user')
  const data = await SubscriptionService.createCheckoutSession(user.id)
  return c.json({ success: true, data })
})

// Open the Stripe-hosted billing portal (update card, cancel, view invoices).
subscriptionRoutes.post('/portal', authenticate, requireRole('caster'), async (c) => {
  const user = c.get('user')
  const data = await SubscriptionService.createPortalSession(user.id)
  return c.json({ success: true, data })
})

// Current subscription status for the caster (drives the gate + billing UI).
subscriptionRoutes.get('/status', authenticate, requireRole('caster'), async (c) => {
  const user = c.get('user')
  const data = await SubscriptionService.getStatus(user.id)
  return c.json({ success: true, data })
})
