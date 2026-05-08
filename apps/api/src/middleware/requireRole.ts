import type { Context, Next } from 'hono'
import type { UserRole } from '@castflow/types'
import { AppError } from '../errors'

export function requireRole(...roles: UserRole[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as { role: string } | undefined

    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Authentication required', 401)
    }

    if (!roles.includes(user.role as UserRole)) {
      throw new AppError(
        'FORBIDDEN',
        'You do not have permission to perform this action',
        403
      )
    }

    await next()
  }
}
