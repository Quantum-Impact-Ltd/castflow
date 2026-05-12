import { Hono } from 'hono'
import type { z, ZodType } from 'zod'
import {
  artistPersonalInfoSchema,
  modelStatsSchema,
  actorStatsSchema,
  artistExperienceSchema,
} from '@castflow/validators'
import { authenticate } from '../middleware/authenticate'
import { requireRole } from '../middleware/requireRole'
import { ArtistService } from '../services/ArtistService'
import { AppError } from '../errors'

interface UserCtx {
  id: string
  role: string
}

type AppEnv = { Variables: { user: UserCtx } }

export const artistRoutes = new Hono<AppEnv>()

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

artistRoutes.get('/me', authenticate, requireRole('artist'), async (c) => {
  const user = c.get('user')
  const profile = await ArtistService.getMyProfile(user.id)
  return c.json({ success: true, data: profile })
})

artistRoutes.patch('/me/personal', authenticate, requireRole('artist'), async (c) => {
  const user = c.get('user')
  const input = await parseBody(c, artistPersonalInfoSchema)
  const profile = await ArtistService.updatePersonalInfo(user.id, input)
  return c.json({ success: true, data: profile })
})

artistRoutes.patch('/me/model-stats', authenticate, requireRole('artist'), async (c) => {
  const user = c.get('user')
  const input = await parseBody(c, modelStatsSchema)
  const stats = await ArtistService.updateModelStats(user.id, input)
  return c.json({ success: true, data: stats })
})

artistRoutes.patch('/me/actor-stats', authenticate, requireRole('artist'), async (c) => {
  const user = c.get('user')
  const input = await parseBody(c, actorStatsSchema)
  const stats = await ArtistService.updateActorStats(user.id, input)
  return c.json({ success: true, data: stats })
})

artistRoutes.patch('/me/experience', authenticate, requireRole('artist'), async (c) => {
  const user = c.get('user')
  const input = await parseBody(c, artistExperienceSchema)
  const profile = await ArtistService.updateExperience(user.id, input)
  return c.json({ success: true, data: profile })
})

artistRoutes.post('/me/submit', authenticate, requireRole('artist'), async (c) => {
  const user = c.get('user')
  const profile = await ArtistService.submitForReview(user.id)
  return c.json({ success: true, data: profile })
})
