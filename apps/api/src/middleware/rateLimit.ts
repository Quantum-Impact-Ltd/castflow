import type { Context, MiddlewareHandler } from 'hono'
import { env } from '../lib/env'
import { AppError } from '../errors'

type KeyFn = (c: Context) => string

interface RateLimitOptions {
  windowMs: number
  max: number
  key?: KeyFn
  message?: string
  /** Scope tag — combined with the key so multiple limiters can coexist on overlapping paths. */
  scope?: string
}

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()
let lastSweep = 0
const SWEEP_INTERVAL_MS = 60_000

function sweep(now: number): void {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return
  lastSweep = now
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k)
  }
}

function defaultIpKey(c: Context): string {
  const xff = c.req.header('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  return c.req.header('x-real-ip') ?? c.req.header('cf-connecting-ip') ?? 'unknown'
}

export function rateLimit(opts: RateLimitOptions): MiddlewareHandler {
  const {
    windowMs,
    max,
    key = defaultIpKey,
    message = 'Too many requests — please slow down',
    scope = 'global',
  } = opts

  return async (c, next) => {
    // Disabled in tests so the suite isn't flaky.
    if (env.NODE_ENV === 'test') {
      await next()
      return
    }

    const now = Date.now()
    sweep(now)

    const bucketKey = `${scope}:${key(c)}`
    const existing = buckets.get(bucketKey)

    if (!existing || existing.resetAt <= now) {
      buckets.set(bucketKey, { count: 1, resetAt: now + windowMs })
    } else {
      existing.count += 1
      if (existing.count > max) {
        const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
        c.header('Retry-After', String(retryAfter))
        throw new AppError('RATE_LIMITED', message, 429)
      }
    }

    await next()
  }
}

/** Rate-limit keyed on the authenticated user id (falls back to IP if no user on context). */
export function rateLimitByUser(opts: RateLimitOptions): MiddlewareHandler {
  return rateLimit({
    ...opts,
    key: (c) => {
      const user = c.get('user') as { id?: string } | undefined
      return user?.id ?? defaultIpKey(c)
    },
  })
}
