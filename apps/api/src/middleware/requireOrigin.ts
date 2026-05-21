import type { Context, Next } from 'hono'
import { env } from '../lib/env'
import { AppError } from '../errors'

/**
 * Lightweight CSRF defence for state-changing requests on `/api/v1/*`.
 *
 * Modern browsers always send the `Origin` header on POST/PATCH/PUT/DELETE
 * requests (Fetch spec §3.6). Comparing it to an allowlist blocks a
 * malicious third-party site from triggering authenticated mutations via
 * the user's cookies — the classic CSRF vector that CORS alone doesn't stop.
 *
 * Read-only methods (GET/HEAD/OPTIONS) are skipped because they shouldn't
 * mutate state. Webhooks (Stripe) and Better Auth's own endpoints are
 * excluded by mount path — they're either signed (Stripe) or have their
 * own CSRF protection (Better Auth's cookies).
 */
const READ_ONLY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

function buildAllowedOrigins(): ReadonlySet<string> {
  const allowed = new Set<string>([env.FRONTEND_URL])
  if (env.NODE_ENV !== 'production') {
    // Dev convenience — Vercel preview, localhost, and the API host itself
    // when devs hit endpoints from a browser tab against the API URL.
    allowed.add('http://localhost:3000')
    allowed.add('http://localhost:3001')
    allowed.add('http://127.0.0.1:3000')
    allowed.add('http://127.0.0.1:3001')
  }
  return allowed
}

const allowedOrigins = buildAllowedOrigins()

export async function requireOrigin(c: Context, next: Next): Promise<void | Response> {
  if (READ_ONLY_METHODS.has(c.req.method)) {
    return next()
  }

  const origin = c.req.header('origin')
  if (!origin) {
    // Server-to-server or curl requests don't set Origin. Block them on
    // state-changing routes — legitimate clients always go through a
    // browser, which sets Origin automatically.
    throw new AppError('FORBIDDEN', 'Missing Origin header', 403)
  }

  if (!allowedOrigins.has(origin)) {
    throw new AppError('FORBIDDEN', 'Origin not allowed', 403)
  }

  return next()
}
