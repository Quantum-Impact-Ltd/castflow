import type { RegisterArtistInput, RegisterCasterInput } from '@castflow/validators'
import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { auth } from '../lib/auth'
import { env } from '../lib/env'
import { AppError } from '../errors'

/**
 * Dev convenience: when DEV_AUTO_VERIFY_EMAIL=true on a non-production
 * environment, mark a freshly-created user as email-verified so they can
 * log in immediately without a working Resend setup. Production always
 * ignores the flag — verification is required for live signups.
 */
function isDevAutoVerifyEnabled(): boolean {
  return env.DEV_AUTO_VERIFY_EMAIL === true && env.NODE_ENV !== 'production'
}

async function maybeAutoVerifyEmail(
  tx: Prisma.TransactionClient,
  userId: string
): Promise<void> {
  if (!isDevAutoVerifyEnabled()) return
  await tx.user.update({
    where: { id: userId },
    data: { emailVerified: true },
  })
}

export interface RegistrationResult {
  user: { id: string; email: string }
  /** True when a verification email was sent — false in dev-bypass mode. */
  verificationEmailSent: boolean
  /** True when the account is already verified (dev bypass). The frontend
   *  uses this to decide whether to send the user to /verify-email or
   *  straight to /login. */
  emailVerified: boolean
}

function mapBetterAuthError(err: unknown): never {
  // Better Auth throws APIError instances with status + body.message.
  // Translate the common ones to our canonical AppError codes.
  const e = err as { status?: string | number; body?: { message?: string } } & Error
  const message = e.body?.message ?? e.message ?? 'Sign-up failed'
  const lower = message.toLowerCase()

  if (lower.includes('already') || lower.includes('exist') || lower.includes('taken')) {
    throw new AppError('EMAIL_TAKEN', 'An account with this email already exists', 409)
  }
  if (lower.includes('password')) {
    throw new AppError('WEAK_PASSWORD', message, 400)
  }
  if (lower.includes('blocked') || lower.includes('banned')) {
    throw new AppError('BANNED', 'This email is blocked', 403)
  }

  if (err instanceof AppError) throw err

  throw new AppError('VALIDATION_ERROR', message, 400)
}

async function assertEmailAvailable(email: string): Promise<void> {
  // Better Auth's sign-up returns a fake-success response for existing emails
  // (account-enumeration protection enabled by `requireEmailVerification: true`),
  // so we must pre-check uniqueness before calling signUpEmail. A small race
  // window remains; the DB's unique-email constraint catches concurrent dupes.
  const normalized = email.toLowerCase()
  const existing = await prisma.user.findFirst({
    where: { email: normalized },
    select: { id: true, status: true },
  })
  if (!existing) return
  if (existing.status === 'banned') {
    throw new AppError('BANNED', 'This email is blocked', 403)
  }
  throw new AppError('EMAIL_TAKEN', 'An account with this email already exists', 409)
}

async function signUp(input: {
  email: string
  password: string
  name: string
  role: 'artist' | 'caster'
}): Promise<{ id: string; email: string }> {
  try {
    const result = await auth.api.signUpEmail({
      body: {
        email: input.email,
        password: input.password,
        name: input.name,
        role: input.role,
      },
    })

    const user = (result as { user?: { id?: string; email?: string } }).user
    if (!user?.id || !user.email) {
      throw new AppError('INTERNAL_ERROR', 'Sign-up did not return a user', 500)
    }

    // Defence in depth: confirm the user row actually exists. If Better Auth's
    // enumeration protection still fired (race-condition window), throw 409.
    const persisted = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    })
    if (!persisted) {
      throw new AppError('EMAIL_TAKEN', 'An account with this email already exists', 409)
    }

    return { id: user.id, email: user.email }
  } catch (err) {
    if (err instanceof AppError) throw err
    mapBetterAuthError(err)
  }
}

export class AuthService {
  static async registerArtist(input: RegisterArtistInput): Promise<RegistrationResult> {
    await assertEmailAvailable(input.email)

    const name = `${input.firstName} ${input.lastName}`
    const user = await signUp({
      email: input.email,
      password: input.password,
      name,
      role: 'artist',
    })

    try {
      await prisma.$transaction(async (tx) => {
        const profile = await tx.artistProfile.create({
          data: {
            userId: user.id,
            // Default to 'model' if registration doesn't include a type — the
            // artist confirms or switches in onboarding step 1.
            artistType: input.artistType ?? 'model',
            firstName: input.firstName,
            lastName: input.lastName,
          },
          select: { id: true },
        })

        await tx.user.update({
          where: { id: user.id },
          data: {
            role: 'artist',
            profileId: profile.id,
            approvalStatus: 'pending',
            status: 'active',
          },
        })
        await maybeAutoVerifyEmail(tx, user.id)
      })
    } catch (err) {
      // Best-effort rollback. If this delete also fails we have an orphaned
      // Better Auth user row — surface it loudly so ops can clean up rather
      // than silently swallowing the error.
      await prisma.user.delete({ where: { id: user.id } }).catch((deleteErr: unknown) => {
        console.error('[AuthService] rollback delete failed', {
          userId: user.id,
          email: user.email,
          originalError: err instanceof Error ? err.message : String(err),
          deleteError: deleteErr instanceof Error ? deleteErr.message : String(deleteErr),
        })
      })
      if (err instanceof AppError) throw err
      throw new AppError('INTERNAL_ERROR', 'Could not complete registration', 500)
    }

    const autoVerified = isDevAutoVerifyEnabled()
    return {
      user,
      verificationEmailSent: !autoVerified,
      emailVerified: autoVerified,
    }
  }

  static async registerCaster(input: RegisterCasterInput): Promise<RegistrationResult> {
    await assertEmailAvailable(input.email)

    const user = await signUp({
      email: input.email,
      password: input.password,
      name: input.contactName,
      role: 'caster',
    })

    try {
      await prisma.$transaction(async (tx) => {
        const profile = await tx.casterProfile.create({
          data: {
            userId: user.id,
            companyName: input.companyName,
            companyType: input.companyType,
            contactName: input.contactName,
          },
          select: { id: true },
        })

        await tx.user.update({
          where: { id: user.id },
          data: {
            role: 'caster',
            profileId: profile.id,
            status: 'active',
          },
        })
        await maybeAutoVerifyEmail(tx, user.id)
      })
    } catch (err) {
      // Best-effort rollback. If this delete also fails we have an orphaned
      // Better Auth user row — surface it loudly so ops can clean up rather
      // than silently swallowing the error.
      await prisma.user.delete({ where: { id: user.id } }).catch((deleteErr: unknown) => {
        console.error('[AuthService] rollback delete failed', {
          userId: user.id,
          email: user.email,
          originalError: err instanceof Error ? err.message : String(err),
          deleteError: deleteErr instanceof Error ? deleteErr.message : String(deleteErr),
        })
      })
      if (err instanceof AppError) throw err
      throw new AppError('INTERNAL_ERROR', 'Could not complete registration', 500)
    }

    const autoVerified = isDevAutoVerifyEnabled()
    return {
      user,
      verificationEmailSent: !autoVerified,
      emailVerified: autoVerified,
    }
  }
}
