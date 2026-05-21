import { Hono } from 'hono'
import type { z, ZodType } from 'zod'
import {
  artistPersonalInfoSchema,
  modelStatsSchema,
  actorStatsSchema,
  artistExperienceSchema,
  updateArtistTypeSchema,
  replaceSkillsSchema,
} from '@castflow/validators'
import { authenticate } from '../middleware/authenticate'
import { requireRole } from '../middleware/requireRole'
import { ArtistService } from '../services/ArtistService'
import { UploadService } from '../services/UploadService'
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

artistRoutes.patch('/me/type', authenticate, requireRole('artist'), async (c) => {
  const user = c.get('user')
  const input = await parseBody(c, updateArtistTypeSchema)
  const profile = await ArtistService.updateArtistType(user.id, input)
  return c.json({ success: true, data: profile })
})

artistRoutes.put('/me/skills', authenticate, requireRole('artist'), async (c) => {
  const user = c.get('user')
  const input = await parseBody(c, replaceSkillsSchema)
  const skills = await ArtistService.replaceSkills(user.id, input)
  return c.json({ success: true, data: skills })
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

// Presigned read URL for the artist's own ID document. Used by the
// onboarding ID step to show a preview / "View document" after upload
// so the artist can confirm they uploaded the right file before
// submitting for review. (Audit H14.)
artistRoutes.get('/me/id-document/url', authenticate, requireRole('artist'), async (c) => {
  const user = c.get('user')
  const result = await UploadService.getMyIdDocumentUrl(user.id)
  if (!result) {
    return c.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'No ID document on file' } },
      404,
    )
  }
  return c.json({ success: true, data: result })
})

/**
 * Comp-card PDF for an approved artist (Phase 2). Anyone with the profile id
 * can download it — comp-cards are explicitly public marketing artefacts.
 * Returns `application/pdf` for `?download=1`, otherwise inline.
 */
artistRoutes.get('/:id/comp-card', async (c) => {
  const buffer = await ArtistService.generateCompCard(c.req.param('id') ?? '')
  const isDownload = c.req.query('download') === '1'
  c.header('Content-Type', 'application/pdf')
  c.header(
    'Content-Disposition',
    `${isDownload ? 'attachment' : 'inline'}; filename="comp-card.pdf"`
  )
  return c.body(new Uint8Array(buffer))
})
