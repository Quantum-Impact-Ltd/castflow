import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'
import { env } from './env'
import { EmailService } from '../services/EmailService'
import { AppError } from '../errors'

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),

  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.FRONTEND_URL],

  // In deployed environments the frontend (e.g. Vercel) and this API (e.g.
  // Railway) live on different sites, so the session cookie must be
  // SameSite=None; Secure to be stored and sent on cross-site requests —
  // `Partitioned` keeps it working under browsers' third-party-cookie
  // restrictions (CHIPS). Secure cookies require HTTPS, so this only applies
  // to the HTTPS deploys; local dev stays on the default Lax over http.
  advanced:
    env.NODE_ENV === 'production' || env.NODE_ENV === 'staging'
      ? {
          defaultCookieAttributes: {
            sameSite: 'none',
            secure: true,
            partitioned: true,
          },
        }
      : undefined,

  emailAndPassword: {
    enabled: true,
    // Production always enforces verification. In dev/staging the flag lets
    // you bypass it when Resend isn't configured — see AuthService for the
    // matching `emailVerified=true` write at registration time.
    requireEmailVerification: !(
      env.DEV_AUTO_VERIFY_EMAIL === true && env.NODE_ENV !== 'production'
    ),
    sendResetPassword: async ({ user, url }) => {
      // Rewrite the reset link to point at the web app, which posts the token
      // back to the API via /api/auth/reset-password.
      const u = new URL(url)
      const token = u.searchParams.get('token') ?? ''
      const resetUrl = `${env.FRONTEND_URL}/reset-password/${encodeURIComponent(token)}`
      await EmailService.sendPasswordReset({ to: user.email, resetUrl })
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      // Magic link should land on the web app's verify-email page.
      const u = new URL(url)
      const token = u.searchParams.get('token') ?? ''
      const verifyUrl = `${env.FRONTEND_URL}/verify-email/${encodeURIComponent(token)}`
      await EmailService.sendVerificationEmail({ to: user.email, verifyUrl })
    },
    afterEmailVerification: async (user: { id: string; email: string; role?: string }) => {
      // Fire the welcome email post-verification. Best-effort: a failure must
      // not bubble back into Better Auth and break the verify request.
      try {
        const role = user.role === 'caster' ? 'caster' : 'artist'
        const { ArtistService } = await import('../services/ArtistService')
        await ArtistService.sendWelcomeAfterVerification({
          userId: user.id,
          email: user.email,
          role,
        })
      } catch (err) {
        console.error('[auth] welcome email failed', {
          userId: user.id,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    },
    autoSignInAfterVerification: false,
    sendOnSignUp: true,
  },

  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET
      ? {
          apple: {
            clientId: env.APPLE_CLIENT_ID,
            clientSecret: env.APPLE_CLIENT_SECRET,
          },
        }
      : {}),
  },

  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'artist',
        input: true,
      },
      profileId: {
        type: 'string',
        required: false,
        input: false,
      },
      approvalStatus: {
        type: 'string',
        required: false,
        input: false,
      },
      status: {
        type: 'string',
        required: true,
        defaultValue: 'pending',
        input: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user: { email: string }) => {
          // Case-insensitive match — Better Auth lowercases, but direct DB
          // seeds can land with mixed case. Don't let casing slip a ban.
          const existing = await prisma.user.findFirst({
            where: {
              email: { equals: user.email, mode: 'insensitive' },
              status: 'banned',
            },
          })
          if (existing) {
            throw new AppError('BANNED', 'This email is blocked', 403)
          }
          return { data: user }
        },
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
})

export type Auth = typeof auth
export type Session = typeof auth.$Infer.Session
