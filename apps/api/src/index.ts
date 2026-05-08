import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { createBunWebSocket } from 'hono/bun'
import { env } from './lib/env'
import { auth } from './lib/auth'
import { AppError } from './errors'

import { authRoutes } from './routes/auth'
import { artistRoutes } from './routes/artists'
import { casterRoutes } from './routes/casters'
import { jobRoutes } from './routes/jobs'
import { bidRoutes } from './routes/bids'
import { bookingRoutes } from './routes/bookings'
import { contractRoutes } from './routes/contracts'
import { paymentRoutes } from './routes/payments'
import { messageRoutes } from './routes/messages'
import { reviewRoutes } from './routes/reviews'
import { disputeRoutes } from './routes/disputes'
import { notificationRoutes } from './routes/notifications'
import { uploadRoutes } from './routes/uploads'
import { talentRoutes } from './routes/talent'
import { webhookRoutes } from './routes/webhooks'
import { adminRoutes } from './routes/admin'

const { upgradeWebSocket, websocket } = createBunWebSocket()

export const app = new Hono()

// ── Middleware ─────────────────────────────────────────────────────────────
app.use('*', logger())
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
app.get('/health', (c) =>
  c.json({ success: true, data: { status: 'ok', env: env.NODE_ENV } })
)

// ── Better Auth ────────────────────────────────────────────────────────────
app.on(['GET', 'POST'], '/api/auth/**', (c) => auth.handler(c.req.raw))

// ── API v1 ─────────────────────────────────────────────────────────────────
const api = app.basePath('/api/v1')

api.route('/auth', authRoutes)
api.route('/artists', artistRoutes)
api.route('/casters', casterRoutes)
api.route('/jobs', jobRoutes)
api.route('/bids', bidRoutes)
api.route('/bookings', bookingRoutes)
api.route('/contracts', contractRoutes)
api.route('/payments', paymentRoutes)
api.route('/messages', messageRoutes)
api.route('/reviews', reviewRoutes)
api.route('/disputes', disputeRoutes)
api.route('/notifications', notificationRoutes)
api.route('/uploads', uploadRoutes)
api.route('/talent', talentRoutes)
api.route('/admin', adminRoutes)

// ── Stripe webhook ─────────────────────────────────────────────────────────
app.route('/webhooks', webhookRoutes)

// ── WebSocket ──────────────────────────────────────────────────────────────
app.get(
  '/ws/messages/:threadId',
  upgradeWebSocket((c) => {
    const threadId = c.req.param('threadId')
    return {
      onOpen(_event, _ws) {
        console.info(`WS connected: thread ${threadId}`)
      },
      onMessage(event, _ws) {
        console.info(`WS message on thread ${threadId}:`, event.data)
      },
      onClose() {
        console.info(`WS disconnected: thread ${threadId}`)
      },
    }
  })
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
