import { Hono } from 'hono'
import { authenticate } from '../middleware/authenticate'
import { requireRole } from '../middleware/requireRole'
import { prisma } from '../lib/prisma'

type AppEnv = { Variables: { user: { id: string; role: string } } }

export const talentRoutes = new Hono<AppEnv>()

// Public-ish artist directory — approved+available only, no contact info.
talentRoutes.get('/', async (c) => {
  const artistType = c.req.query('artistType') as 'model' | 'actor' | undefined
  const city = c.req.query('city')
  const search = c.req.query('search')
  const cursor = c.req.query('cursor')
  const limit = Math.min(Math.max(Number(c.req.query('limit') ?? 25), 1), 100)

  const where = {
    approvalStatus: 'approved' as const,
    availabilityStatus: 'available' as const,
    ...(artistType ? { artistType } : {}),
    ...(city ? { city: { contains: city, mode: 'insensitive' as const } } : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { bio: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const rows = await prisma.artistProfile.findMany({
    where,
    orderBy: { ratingAvg: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      firstName: true,
      artistType: true,
      city: true,
      ratingAvg: true,
      ratingCount: true,
      jobsCompleted: true,
      portfolioItems: { take: 1, where: { isPrimary: true, isApproved: true } },
    },
  })
  const hasNext = rows.length > limit
  const items = hasNext ? rows.slice(0, limit) : rows
  return c.json({
    success: true,
    data: items,
    meta: { nextCursor: hasNext ? (items.at(-1)?.id ?? null) : null },
  })
})

// Caster-only talent detail with full portfolio. Sensitive fields
// (lastName, dob, idDocumentUrl, userId, approvalNotes, strikeCount,
// approvedById) are explicitly excluded from the Prisma select so they
// never leave the DB. Anything not listed is excluded by definition.
talentRoutes.get('/:id', authenticate, requireRole('caster'), async (c) => {
  const profile = await prisma.artistProfile.findUnique({
    where: { id: c.req.param('id') ?? '' },
    select: {
      id: true,
      artistType: true,
      firstName: true,
      gender: true,
      pronouns: true,
      city: true,
      bio: true,
      experienceLevel: true,
      instagramHandle: true,
      availabilityStatus: true,
      approvalStatus: true,
      approvedAt: true,
      idVerified: true,
      ratingAvg: true,
      ratingCount: true,
      jobsCompleted: true,
      responseRate: true,
      createdAt: true,
      modelStats: true,
      actorStats: true,
      skills: true,
      portfolioItems: {
        where: { isApproved: true },
        orderBy: { displayOrder: 'asc' },
      },
    },
  })
  if (!profile || profile.approvalStatus !== 'approved') {
    return c.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Talent not found' } },
      404
    )
  }
  return c.json({ success: true, data: profile })
})
