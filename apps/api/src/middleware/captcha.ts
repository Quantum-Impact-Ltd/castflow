import type { MiddlewareHandler } from 'hono'
import { env } from '../lib/env'
import { AppError } from '../errors'

interface TurnstileResponse {
  success: boolean
  'error-codes'?: string[]
  hostname?: string
  challenge_ts?: string
  action?: string
}

async function verifyTurnstileToken(token: string, remoteIp: string | null): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) return true // feature-flagged off
  const body = new URLSearchParams()
  body.set('secret', env.TURNSTILE_SECRET_KEY)
  body.set('response', token)
  if (remoteIp) body.set('remoteip', remoteIp)
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    })
    if (!res.ok) return false
    const data = (await res.json()) as TurnstileResponse
    return data.success === true
  } catch {
    return false
  }
}

/**
 * Cloudflare Turnstile CAPTCHA enforcement. No-op in dev / test (when
 * TURNSTILE_SECRET_KEY isn't set) so local registration still works.
 *
 * Reads the token from the `x-captcha-token` header OR a `captchaToken`
 * body field. Test (`NODE_ENV === 'test'`) bypasses entirely so the
 * existing register-artist suite stays deterministic.
 *
 * (Audit H5.)
 */
export const requireCaptcha: MiddlewareHandler = async (c, next) => {
  if (env.NODE_ENV === 'test') {
    await next()
    return
  }
  if (!env.TURNSTILE_SECRET_KEY) {
    await next()
    return
  }

  // Header preferred; body fallback so we don't have to fight the existing
  // validator schemas to thread a new field through.
  let token = c.req.header('x-captcha-token') ?? ''
  if (!token) {
    const cloned = c.req.raw.clone()
    try {
      const body = (await cloned.json()) as { captchaToken?: unknown } | null
      if (body && typeof body.captchaToken === 'string') token = body.captchaToken
    } catch {
      // Body not JSON or empty — token stays empty, fails below.
    }
  }

  if (!token) {
    throw new AppError('CAPTCHA_REQUIRED', 'Captcha verification required', 400)
  }

  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    c.req.header('cf-connecting-ip') ??
    null
  const ok = await verifyTurnstileToken(token, ip)
  if (!ok) {
    throw new AppError('CAPTCHA_FAILED', 'Captcha verification failed', 403)
  }
  await next()
}
