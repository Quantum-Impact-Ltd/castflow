import type { Context, Next } from 'hono'
import { auth } from '../lib/auth'
import { AppError } from '../errors'

export async function authenticate(c: Context, next: Next) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })

  if (!session?.user) {
    throw new AppError('UNAUTHORIZED', 'Authentication required', 401)
  }

  if (session.user.status === 'suspended') {
    throw new AppError(
      'ACCOUNT_SUSPENDED',
      'Your account has been suspended. Please contact support.',
      403
    )
  }

  if (session.user.status === 'banned') {
    throw new AppError('UNAUTHORIZED', 'Authentication required', 401)
  }

  c.set('user', session.user)
  c.set('session', session.session)

  await next()
}
