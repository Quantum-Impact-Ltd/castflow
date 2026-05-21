import { Hono } from 'hono'
import { z } from 'zod'
import { authenticate } from '../middleware/authenticate'
import { requireRole } from '../middleware/requireRole'
import { prisma } from '../lib/prisma'
import { AppError } from '../errors'

type AppEnv = { Variables: { user: { id: string; role: string } } }

const updateProfileSchema = z.object({
  companyName: z.string().min(1).max(100).optional(),
  contactName: z.string().min(1).max(100).optional(),
  phone: z.string().max(30).optional(),
  website: z.string().url().optional().or(z.literal('')),
})

export const casterRoutes = new Hono<AppEnv>()

casterRoutes.get('/me', authenticate, requireRole('caster'), async (c) => {
  const user = c.get('user')
  const profile = await prisma.casterProfile.findUnique({ where: { userId: user.id } })
  if (!profile) throw new AppError('NOT_FOUND', 'Caster profile not found', 404)
  return c.json({ success: true, data: profile })
})

casterRoutes.post('/me/complete-onboarding', authenticate, requireRole('caster'), async (c) => {
  const user = c.get('user')
  const profile = await prisma.casterProfile.findUnique({ where: { userId: user.id } })
  if (!profile) throw new AppError('NOT_FOUND', 'Caster profile not found', 404)
  if (profile.onboardingCompletedAt) return c.json({ success: true, data: profile })
  const updated = await prisma.casterProfile.update({
    where: { id: profile.id },
    data: { onboardingCompletedAt: new Date() },
  })
  return c.json({ success: true, data: updated })
})

casterRoutes.patch('/me', authenticate, requireRole('caster'), async (c) => {
  const user = c.get('user')
  const parsed = updateProfileSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid input',
      400,
      parsed.error.flatten().fieldErrors as Record<string, string[]>
    )
  }
  const profile = await prisma.casterProfile.findUnique({ where: { userId: user.id } })
  if (!profile) throw new AppError('NOT_FOUND', 'Caster profile not found', 404)

  const data: Record<string, unknown> = {}
  if (parsed.data.companyName) data.companyName = parsed.data.companyName
  if (parsed.data.contactName) data.contactName = parsed.data.contactName
  if (parsed.data.phone !== undefined) data.phone = parsed.data.phone || null
  if (parsed.data.website !== undefined) data.website = parsed.data.website || null

  const updated = await prisma.casterProfile.update({
    where: { id: profile.id },
    data,
  })
  return c.json({ success: true, data: updated })
})
