import type { Context, Next } from 'hono'
import { AppError } from '../errors'

export async function requireApproved(c: Context, next: Next) {
  const user = c.get('user') as { approvalStatus?: string } | undefined

  if (user?.approvalStatus === 'pending') {
    throw new AppError(
      'ACCOUNT_PENDING',
      'Your profile is pending approval. You will be notified by email.',
      403
    )
  }

  if (user?.approvalStatus === 'rejected') {
    throw new AppError(
      'ACCOUNT_REJECTED',
      'Your application was not approved. Please check your email for details.',
      403
    )
  }

  await next()
}
