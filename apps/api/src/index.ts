import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { safeLog } from './lib/log'
import { createBunWebSocket } from 'hono/bun'
import { env } from './lib/env'
import { auth } from './lib/auth'
import { AppError } from './errors'

import { rateLimit } from './middleware/rateLimit'
import { requireOrigin } from './middleware/requireOrigin'
import { authRoutes } from './routes/auth'
import { artistRoutes } from './routes/artists'
import { casterRoutes } from './routes/casters'
import { jobRoutes } from './routes/jobs'
import { bidRoutes } from './routes/bids'
import { bookingRoutes } from './routes/bookings'
import { contractRoutes } from './routes/contracts'
import { subscriptionRoutes } from './routes/subscriptions'
import { messageRoutes } from './routes/messages'
import { reviewRoutes } from './routes/reviews'
import { disputeRoutes } from './routes/disputes'
import { notificationRoutes } from './routes/notifications'
import { uploadRoutes } from './routes/uploads'
import { talentRoutes } from './routes/talent'
import { inviteRoutes } from './routes/invites'
import { contactRoutes } from './routes/contact'
import { calendarRoutes } from './routes/calendar'
import { webhookRoutes } from './routes/webhooks'
import { adminRoutes } from './routes/admin'
import { MessageService } from './services/MessageService'
import { joinThread, leaveThread } from './ws/registry'

const { upgradeWebSocket, websocket } = createBunWebSocket()

export const app = new Hono()

// ── Middleware ─────────────────────────────────────────────────────────────
// Custom print fn scrubs auth tokens from query strings and path segments
// before logs ship to stdout / log storage. (Audit H2.)
app.use('*', logger(safeLog))
app.use(
  '*',
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
)

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ success: true, data: { status: 'ok', env: env.NODE_ENV } }))

// ── Better Auth ────────────────────────────────────────────────────────────
// Throttle the auth surface before delegating to Better Auth's handler.
// Login: 10 attempts / 15 min per IP. Password reset: 5 / hour per IP.
app.use(
  '/api/auth/sign-in/**',
  rateLimit({
    scope: 'auth:sign-in',
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many sign-in attempts. Try again later.',
  })
)
app.use(
  '/api/auth/forget-password',
  rateLimit({
    scope: 'auth:forget-password',
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: 'Too many password-reset requests. Try again later.',
  })
)
// Resend-verification: hard cap per (email, IP). Without this an attacker
// can email-bomb a target by replaying the endpoint, burning Resend quota
// and getting the sender domain blocklisted. Read the email from a cloned
// request body so Better Auth's downstream handler still sees the original.
app.use(
  '/api/auth/send-verification-email',
  rateLimit({
    scope: 'auth:resend-verification',
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: 'Too many verification-email requests. Try again later.',
    key: async (c) => {
      let email = 'unknown'
      try {
        const cloned = c.req.raw.clone()
        const body = (await cloned.json()) as { email?: unknown } | null
        if (body && typeof body.email === 'string') {
          email = body.email.trim().toLowerCase()
        }
      } catch {
        // Malformed body — fall back to IP-only key.
      }
      const ip =
        c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
        c.req.header('x-real-ip') ??
        c.req.header('cf-connecting-ip') ??
        'unknown'
      return `${email}|${ip}`
    },
  })
)
// Block Better Auth's auto-mounted sign-up endpoint. Our canonical entry
// points are POST /api/v1/auth/register-artist|register-caster — those run
// inside a transaction that creates the ArtistProfile/CasterProfile rows.
// Hitting BA's bare /sign-up/email would create a user with no profile,
// leaving an orphan that breaks every downstream relation. Reject it with a
// 404 so the route effectively doesn't exist from a client's perspective.
app.all('/api/auth/sign-up/*', (c) =>
  c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404)
)

// `*` reliably captures the full Better Auth surface here. In this app shape,
// `/**` appeared in the route table but fell through to Hono's 404 handler.
app.on(['GET', 'POST'], '/api/auth/*', async (c) => {
  return await auth.handler(c.req.raw)
})

// ── API v1 ─────────────────────────────────────────────────────────────────
const api = app.basePath('/api/v1')

// CSRF defence: every state-changing /api/v1/* call must come from an
// allowed Origin. Read-only methods pass through. Webhooks live under
// /webhooks/* and have their own signature check.
api.use('*', requireOrigin)

api.route('/auth', authRoutes)
api.route('/artists', artistRoutes)
api.route('/casters', casterRoutes)
api.route('/jobs', jobRoutes)
api.route('/bids', bidRoutes)
api.route('/bookings', bookingRoutes)
api.route('/contracts', contractRoutes)
api.route('/subscriptions', subscriptionRoutes)
api.route('/messages', messageRoutes)
api.route('/reviews', reviewRoutes)
api.route('/disputes', disputeRoutes)
api.route('/notifications', notificationRoutes)
api.route('/uploads', uploadRoutes)
api.route('/talent', talentRoutes)
api.route('/invites', inviteRoutes)
api.route('/contact', contactRoutes)
api.route('/calendar', calendarRoutes)
api.route('/admin', adminRoutes)

// ── Stripe webhook ─────────────────────────────────────────────────────────
app.route('/webhooks', webhookRoutes)

// ── WebSocket ──────────────────────────────────────────────────────────────
// Real-time message delivery. The upgrade is authenticated via the Better Auth
// session cookie (same-origin credentials) and authorised against thread
// participation + the `unlocked` gate — mirroring the REST THREAD_LOCKED rule.
// Persistence stays on POST /api/v1/messages/threads/:id; that service call
// broadcasts the persisted row here (see MessageService.sendMessage).
app.get(
  '/ws/messages/:threadId',
  upgradeWebSocket(async (c) => {
    const threadId = c.req.param('threadId') ?? ''
    const session = await auth.api.getSession({ headers: c.req.raw.headers }).catch(() => null)
    const user = session?.user
    const authorized = user
      ? await MessageService.canAccessThread(
          { id: user.id, role: user.role as 'admin' | 'caster' | 'artist' },
          threadId
        ).catch(() => false)
      : false

    return {
      onOpen(_event, ws) {
        if (!authorized) {
          // 1008 = policy violation. The client falls back to REST polling.
          ws.close(1008, 'Unauthorized')
          return
        }
        joinThread(threadId, ws)
      },
      onClose(_event, ws) {
        leaveThread(threadId, ws)
      },
      // Inbound frames are ignored — clients send via the REST endpoint, which
      // persists and then broadcasts. This keeps the socket read-only and the
      // contact-detail flagging / notification logic in one place.
      onMessage() {},
    }
  })
)

// ── 404 handler ────────────────────────────────────────────────────────────
app.notFound((c) =>
  c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404)
)

// ── Global error handler ───────────────────────────────────────────────────
app.onError((err, c) => {
  console.error('[Error]', err)

  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        error: {
          code: err.code,
          message: err.message,
          ...(err.fields ? { fields: err.fields } : {}),
        },
      },
      err.statusCode as Parameters<typeof c.json>[1]
    )
  }

  if ((err as NodeJS.ErrnoException).code === 'P2002') {
    return c.json(
      { success: false, error: { code: 'DUPLICATE', message: 'Resource already exists' } },
      409
    )
  }

  if ((err as NodeJS.ErrnoException).code === 'P2025') {
    return c.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Resource not found' } },
      404
    )
  }

  return c.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
    500
  )
})

// ── Start ──────────────────────────────────────────────────────────────────
export default {
  port: env.PORT,
  fetch: app.fetch,
  websocket,
}

console.info(`🚀 CastFlow API on http://localhost:${env.PORT} [${env.NODE_ENV}]`)
