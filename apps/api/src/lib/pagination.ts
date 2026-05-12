import type { Context } from 'hono'

/**
 * Uniform cursor pagination. Read `?cursor=<id>&limit=<n>` from the request.
 * `limit` defaults to 25 and is clamped to [1, max].
 *
 * Usage in a route:
 *
 *   const { cursor, limit } = parsePagination(c)
 *   const rows = await prisma.user.findMany({
 *     where, orderBy,
 *     take: limit + 1,
 *     ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
 *   })
 *   const { items, nextCursor } = paginate(rows, limit)
 *   return c.json({ success: true, data: items, meta: { nextCursor } })
 *
 * The cursor spread is inlined at each call site rather than extracted into
 * a helper because `exactOptionalPropertyTypes: true` makes a unioned helper
 * return type incompatible with Prisma's generated `FindManyArgs`.
 */
export function parsePagination(c: Context, defaultLimit = 25, max = 100) {
  const cursor = c.req.query('cursor')
  const rawLimit = c.req.query('limit')
  const parsedLimit = rawLimit ? Number(rawLimit) : defaultLimit
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), max)
    : defaultLimit
  return { cursor, limit }
}

export function paginate<T extends { id: string }>(rows: T[], limit: number) {
  const hasNext = rows.length > limit
  const items = hasNext ? rows.slice(0, limit) : rows
  return { items, nextCursor: hasNext ? (items.at(-1)?.id ?? null) : null }
}
