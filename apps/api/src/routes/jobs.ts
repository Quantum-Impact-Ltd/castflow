import { Hono } from 'hono'
import type { z, ZodType } from 'zod'
import { createJobSchema, updateJobSchema } from '@castflow/validators'
import { authenticate } from '../middleware/authenticate'
import { requireRole } from '../middleware/requireRole'
import { JobService } from '../services/JobService'
import { AppError } from '../errors'

type AppEnv = { Variables: { user: { id: string; role: string } } }

export const jobRoutes = new Hono<AppEnv>()

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

// ── Public: list active jobs + detail ───────────────────────────────────────
jobRoutes.get('/', async (c) => {
  const filters = {
    category: c.req.query('category') as 'model' | 'actor' | 'voiceover' | 'extra' | undefined,
    locationCity: c.req.query('locationCity'),
    paymentType: c.req.query('paymentType') as 'fixed' | 'hourly' | undefined,
    search: c.req.query('search'),
    cursor: c.req.query('cursor'),
    limit: c.req.query('limit') ? Number(c.req.query('limit')) : undefined,
  }
  const cleaned: Parameters<typeof JobService.listPublic>[0] = {}
  if (filters.category) cleaned.category = filters.category
  if (filters.locationCity) cleaned.locationCity = filters.locationCity
  if (filters.paymentType) cleaned.paymentType = filters.paymentType
  if (filters.search) cleaned.search = filters.search
  if (filters.cursor) cleaned.cursor = filters.cursor
  if (filters.limit !== undefined && Number.isFinite(filters.limit)) cleaned.limit = filters.limit

  const result = await JobService.listPublic(cleaned)
  return c.json({ success: true, data: result.items, meta: { nextCursor: result.nextCursor } })
})

jobRoutes.get('/:id', async (c) => {
  const job = await JobService.getPublicDetail(c.req.param('id'))
  return c.json({ success: true, data: job })
})

// ── Caster: my jobs + create + update + cancel ─────────────────────────────
jobRoutes.get('/me/list', authenticate, requireRole('caster'), async (c) => {
  const user = c.get('user')
  const status = c.req.query('status') as
    | 'draft'
    | 'active'
    | 'filled'
    | 'expired'
    | 'cancelled'
    | 'closed'
    | undefined
  const cursor = c.req.query('cursor')
  const limit = c.req.query('limit') ? Number(c.req.query('limit')) : undefined
  const { items, nextCursor } = await JobService.listMyJobs(user.id, {
    ...(status ? { status } : {}),
    ...(cursor ? { cursor } : {}),
    ...(limit !== undefined ? { limit } : {}),
  })
  return c.json({ success: true, data: items, meta: { nextCursor } })
})

jobRoutes.post('/', authenticate, requireRole('caster'), async (c) => {
  const user = c.get('user')
  const input = await parseBody(c, createJobSchema)
  const job = await JobService.createJob(user.id, input)
  return c.json({ success: true, data: job })
})

jobRoutes.patch('/:id', authenticate, requireRole('caster'), async (c) => {
  const user = c.get('user')
  const input = await parseBody(c, updateJobSchema)
  const id = c.req.param('id') ?? ''
  const job = await JobService.updateJob(user.id, id, input)
  return c.json({ success: true, data: job })
})

jobRoutes.post('/:id/cancel', authenticate, requireRole('caster'), async (c) => {
  const user = c.get('user')
  const id = c.req.param('id') ?? ''
  const job = await JobService.cancelJob(user.id, id)
  return c.json({ success: true, data: job })
})
