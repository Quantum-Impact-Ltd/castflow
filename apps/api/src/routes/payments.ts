import { Hono } from 'hono'
import { authenticate } from '../middleware/authenticate'
import { requireRole } from '../middleware/requireRole'
import { PaymentService } from '../services/PaymentService'

type AppEnv = { Variables: { user: { id: string; role: string } } }

export const paymentRoutes = new Hono<AppEnv>()

paymentRoutes.post('/bookings/:id/intent', authenticate, requireRole('caster'), async (c) => {
  const user = c.get('user')
  const payment = await PaymentService.createEscrowIntent(user.id, c.req.param('id') ?? '')
  return c.json({ success: true, data: payment })
})

paymentRoutes.post('/bookings/:id/release', authenticate, requireRole('caster'), async (c) => {
  const payment = await PaymentService.releaseEscrow(c.req.param('id') ?? '', {
    actor: 'caster',
  })
  return c.json({ success: true, data: payment })
})

// ── Stripe Connect (artist payouts) ──────────────────────────────────────
// Artist clicks "set up payouts" → frontend POSTs here → backend creates or
// reuses the Connect Express account and returns a one-time onboarding URL.
paymentRoutes.post('/connect/onboard', authenticate, requireRole('artist'), async (c) => {
  const user = c.get('user')
  const link = await PaymentService.createConnectOnboardingLink(user.id)
  return c.json({ success: true, data: link })
})

// Live status fetch — reconciles cached payoutsEnabled with Stripe.
paymentRoutes.get('/connect/status', authenticate, requireRole('artist'), async (c) => {
  const user = c.get('user')
  const status = await PaymentService.getConnectStatus(user.id)
  return c.json({ success: true, data: status })
})
