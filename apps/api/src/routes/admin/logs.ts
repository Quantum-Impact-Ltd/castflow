import { Hono } from 'hono'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/requireRole'
import { prisma } from '../../lib/prisma'
import { parsePagination, paginate } from '../../lib/pagination'

type AppEnv = { Variables: { user: { id: string; role: string } } }

export const adminLogRoutes = new Hono<AppEnv>()
adminLogRoutes.use('*', authenticate, requireRole('admin'))

/**
 * Resolve the human label for an audit-log entity, batched per entity type so
 * the page renders "Sophie Carter" rather than a raw `ap_seed_…` id.
 */
async function resolveEntityLabels(
  rows: { entityType: string; entityId: string }[]
): Promise<Record<string, string>> {
  const idsByType = new Map<string, Set<string>>()
  for (const r of rows) {
    if (!idsByType.has(r.entityType)) idsByType.set(r.entityType, new Set())
    idsByType.get(r.entityType)!.add(r.entityId)
  }
  const out: Record<string, string> = {}
  const key = (type: string, id: string) => `${type}:${id}`

  const lookups: Promise<void>[] = []
  for (const [type, idSet] of idsByType) {
    const ids = [...idSet]
    if (type === 'artist_profile') {
      lookups.push(
        prisma.artistProfile
          .findMany({
            where: { id: { in: ids } },
            select: { id: true, firstName: true, lastName: true },
          })
          .then((rs) => rs.forEach((r) => (out[key(type, r.id)] = `${r.firstName} ${r.lastName}`)))
      )
    } else if (type === 'user') {
      lookups.push(
        prisma.user
          .findMany({ where: { id: { in: ids } }, select: { id: true, name: true, email: true } })
          .then((rs) => rs.forEach((r) => (out[key(type, r.id)] = r.name || r.email)))
      )
    } else if (type === 'job') {
      lookups.push(
        prisma.job
          .findMany({ where: { id: { in: ids } }, select: { id: true, title: true } })
          .then((rs) => rs.forEach((r) => (out[key(type, r.id)] = r.title)))
      )
    }
    // booking / message / review have no human-friendly name — left to the id.
  }
  await Promise.all(lookups)
  return out
}

adminLogRoutes.get('/', async (c) => {
  const adminId = c.req.query('adminId')
  const entityType = c.req.query('entityType')
  const { cursor, limit } = parsePagination(c, 50)
  const rows = await prisma.adminLog.findMany({
    where: {
      ...(adminId ? { adminId } : {}),
      ...(entityType ? { entityType } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const [adminNames, entityLabels] = await Promise.all([
    prisma.user
      .findMany({
        where: { id: { in: [...new Set(rows.map((r) => r.adminId))] } },
        select: { id: true, name: true },
      })
      .then((rs) => Object.fromEntries(rs.map((r) => [r.id, r.name]))),
    resolveEntityLabels(rows.map((r) => ({ entityType: r.entityType, entityId: r.entityId }))),
  ])

  const enriched = rows.map((r) => ({
    ...r,
    adminName: adminNames[r.adminId] ?? null,
    entityLabel: entityLabels[`${r.entityType}:${r.entityId}`] ?? null,
  }))

  const { items, nextCursor } = paginate(enriched, limit)
  return c.json({ success: true, data: items, meta: { nextCursor } })
})
