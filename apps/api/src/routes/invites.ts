import { Hono } from 'hono'
import { inviteArtistSchema } from '@castflow/validators'
import { authenticate } from '../middleware/authenticate'
import { requireRole } from '../middleware/requireRole'
import { JobInviteService } from '../services/JobInviteService'
import { AppError } from '../errors'

type AppEnv = { Variables: { user: { id: string; role: string } } }

export const inviteRoutes = new Hono<AppEnv>()

// ── Caster: create an invite for a specific job ────────────────────────────
inviteRoutes.post('/jobs/:jobId', authenticate, requireRole('caster'), async (c) => {
  const user = c.get('user')
  const parsed = inviteArtistSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid input',
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    )
  }
  const invite = await JobInviteService.invite(user.id, c.req.param('jobId') ?? '', parsed.data)
  return c.json({ success: true, data: invite })
})

// ── Artist: list own invites ───────────────────────────────────────────────
inviteRoutes.get('/me/list', authenticate, requireRole('artist'), async (c) => {
  const user = c.get('user')
  const status = c.req.query('status') as 'pending' | 'accepted' | 'declined' | undefined
  const cursor = c.req.query('cursor')
  const limit = c.req.query('limit') ? Number(c.req.query('limit')) : undefined
  const { items, nextCursor } = await JobInviteService.listForArtist(user.id, {
    ...(status ? { status } : {}),
    ...(cursor ? { cursor } : {}),
    ...(limit !== undefined ? { limit } : {}),
  })
  return c.json({ success: true, data: items, meta: { nextCursor } })
})

inviteRoutes.get('/:id', authenticate, requireRole('artist'), async (c) => {
  const user = c.get('user')
  const invite = await JobInviteService.getForArtist(user.id, c.req.param('id') ?? '')
  return c.json({ success: true, data: invite })
})

inviteRoutes.post('/:id/accept', authenticate, requireRole('artist'), async (c) => {
  const user = c.get('user')
  const invite = await JobInviteService.accept(user.id, c.req.param('id') ?? '')
  return c.json({ success: true, data: invite })
})

inviteRoutes.post('/:id/decline', authenticate, requireRole('artist'), async (c) => {
  const user = c.get('user')
  const invite = await JobInviteService.decline(user.id, c.req.param('id') ?? '')
  return c.json({ success: true, data: invite })
})
