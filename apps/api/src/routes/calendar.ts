import { Hono } from 'hono'
import { authenticate } from '../middleware/authenticate'
import { rateLimit } from '../middleware/rateLimit'
import { CalendarService } from '../services/CalendarService'
import { AppError } from '../errors'

type AppEnv = { Variables: { user: { id: string; role: string } } }

export const calendarRoutes = new Hono<AppEnv>()

// Calendar apps poll roughly hourly. 60/min/IP is generous for honest
// polling and blocks brute-force of leaked tokens (40-char URL-safe
// random is intractable anyway, but defence in depth).
const feedLimit = rateLimit({
  scope: 'calendar:feed',
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many calendar requests. Try again later.',
})

// Authenticated: get (or lazily create) the user's calendar feed URL.
calendarRoutes.get('/me', authenticate, async (c) => {
  const user = c.get('user')
  const token = await CalendarService.ensureToken(user.id)
  return c.json({ success: true, data: { url: CalendarService.feedUrl(token) } })
})

// Authenticated: rotate the token (invalidates any active subscriptions).
calendarRoutes.post('/me/regenerate', authenticate, async (c) => {
  const user = c.get('user')
  const token = await CalendarService.regenerateToken(user.id)
  return c.json({ success: true, data: { url: CalendarService.feedUrl(token) } })
})

// Public: calendar apps subscribe to this URL. The token IS the auth — no
// cookies. `:token.ics` matches the typical .ics file extension that
// Apple/Google/Outlook expect from subscription URLs.
calendarRoutes.get('/feed/:tokenFile', feedLimit, async (c) => {
  const tokenFile = c.req.param('tokenFile') ?? ''
  const token = tokenFile.replace(/\.ics$/, '')
  if (!token) throw new AppError('NOT_FOUND', 'Calendar not found', 404)
  const body = await CalendarService.buildFeed(token)
  c.header('Content-Type', 'text/calendar; charset=utf-8')
  c.header('Cache-Control', 'private, max-age=600')
  return c.body(body)
})
