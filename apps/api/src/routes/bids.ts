import { Hono } from 'hono'
import { z, type ZodType } from 'zod'
import { submitBidSchema, updateBidSchema, counterOfferSchema } from '@castflow/validators'
import { authenticate } from '../middleware/authenticate'
import { requireRole } from '../middleware/requireRole'
import { rateLimitByUser } from '../middleware/rateLimit'
import { BidService } from '../services/BidService'
import { AppError } from '../errors'

type AppEnv = { Variables: { user: { id: string; role: string } } }

export const bidRoutes = new Hono<AppEnv>()

const rejectBodySchema = z.object({ reason: z.string().max(500).optional() })
const acceptBodySchema = z.object({ shootLocation: z.string().min(5).max(500) })

async function parseBody<S extends ZodType>(
  c: { req: { json: () => Promise<unknown> } },
  schema: S
): Promise<z.output<S>> {
  const parsed = schema.safeParse(await c.req.json())
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid input',
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    )
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return parsed.data as z.output<S>
}

// 60 bid submissions / hour per artist — well above any honest pace, blocks scripted spam.
const submitBidLimit = rateLimitByUser({
  scope: 'bids:submit',
  windowMs: 60 * 60 * 1000,
  max: 60,
  message: 'Too many bids submitted. Try again later.',
})

// ── Artist ────────────────────────────────────────────────────────────────
bidRoutes.post('/jobs/:jobId', authenticate, requireRole('artist'), submitBidLimit, async (c) => {
  const user = c.get('user')
  const input = await parseBody(c, submitBidSchema)
  const jobId = c.req.param('jobId') ?? ''
  const bid = await BidService.submitBid(user.id, jobId, input)
  return c.json({ success: true, data: bid })
})

bidRoutes.patch('/:id', authenticate, requireRole('artist'), async (c) => {
  const user = c.get('user')
  const input = await parseBody(c, updateBidSchema)
  const bid = await BidService.updateBid(user.id, c.req.param('id') ?? '', input)
  return c.json({ success: true, data: bid })
})

bidRoutes.post('/:id/withdraw', authenticate, requireRole('artist'), async (c) => {
  const user = c.get('user')
  const bid = await BidService.withdrawBid(user.id, c.req.param('id') ?? '')
  return c.json({ success: true, data: bid })
})

bidRoutes.get('/me/list', authenticate, requireRole('artist'), async (c) => {
  const user = c.get('user')
  const status = c.req.query('status') as
    | 'pending'
    | 'shortlisted'
    | 'rejected'
    | 'accepted'
    | 'withdrawn'
    | 'expired'
    | undefined
  const cursor = c.req.query('cursor')
  const limit = c.req.query('limit') ? Number(c.req.query('limit')) : undefined
  const { items, nextCursor } = await BidService.listMyBids(user.id, {
    ...(status ? { status } : {}),
    ...(cursor ? { cursor } : {}),
    ...(limit !== undefined ? { limit } : {}),
  })
  return c.json({ success: true, data: items, meta: { nextCursor } })
})

// ── Caster ────────────────────────────────────────────────────────────────
bidRoutes.get('/jobs/:jobId/list', authenticate, requireRole('caster'), async (c) => {
  const user = c.get('user')
  const bids = await BidService.listBidsForJob(user.id, c.req.param('jobId') ?? '')
  return c.json({ success: true, data: bids })
})

bidRoutes.post('/:id/shortlist', authenticate, requireRole('caster'), async (c) => {
  const user = c.get('user')
  const bid = await BidService.shortlistBid(user.id, c.req.param('id') ?? '')
  return c.json({ success: true, data: bid })
})

bidRoutes.post('/:id/reject', authenticate, requireRole('caster'), async (c) => {
  const user = c.get('user')
  const body = await parseBody(c, rejectBodySchema)
  const bid = await BidService.rejectBid(user.id, c.req.param('id') ?? '', body.reason)
  return c.json({ success: true, data: bid })
})

bidRoutes.post('/:id/undo-reject', authenticate, requireRole('caster'), async (c) => {
  const user = c.get('user')
  const bid = await BidService.undoReject(user.id, c.req.param('id') ?? '')
  return c.json({ success: true, data: bid })
})

bidRoutes.post('/:id/accept', authenticate, requireRole('caster'), async (c) => {
  const user = c.get('user')
  const body = await parseBody(c, acceptBodySchema)
  const booking = await BidService.acceptBid(user.id, c.req.param('id') ?? '', body.shootLocation)
  return c.json({ success: true, data: booking })
})

// ── Counter-offers (Phase 2) ───────────────────────────────────────────────
bidRoutes.post('/:id/counter', authenticate, requireRole('artist'), async (c) => {
  const user = c.get('user')
  const input = await parseBody(c, counterOfferSchema)
  const offer = await BidService.proposeCounterOffer(user.id, c.req.param('id') ?? '', input)
  return c.json({ success: true, data: offer })
})

bidRoutes.post('/counter/:counterId/accept', authenticate, requireRole('caster'), async (c) => {
  const user = c.get('user')
  const offer = await BidService.acceptCounterOffer(user.id, c.req.param('counterId') ?? '')
  return c.json({ success: true, data: offer })
})

bidRoutes.post('/counter/:counterId/decline', authenticate, requireRole('caster'), async (c) => {
  const user = c.get('user')
  const offer = await BidService.declineCounterOffer(user.id, c.req.param('counterId') ?? '')
  return c.json({ success: true, data: offer })
})
