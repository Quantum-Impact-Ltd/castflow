import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),

  DATABASE_URL: z.string().url(),

  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  BETTER_AUTH_URL: z.string().url(),

  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  STRIPE_CONNECT_CLIENT_ID: z.string().min(1),

  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_PUBLIC_BUCKET: z.string().min(1),
  R2_PRIVATE_BUCKET: z.string().min(1),
  R2_CONTRACTS_BUCKET: z.string().min(1),
  R2_PUBLIC_URL: z.string().url(),

  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().email().default('noreply@castflow.co.uk'),
  // Where contact-form submissions land. Defaults to the topic-routed
  // inbox documented on /contact; can be overridden per environment.
  CONTACT_INBOX_EMAIL: z.string().email().default('hello@castflow.co.uk'),

  FRONTEND_URL: z.string().url(),

  PLATFORM_COMMISSION_RATE: z.coerce.number().min(0).max(100).default(15),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_CLIENT_SECRET: z.string().optional(),

  // Cloudflare Turnstile secret for CAPTCHA verification on register
  // endpoints. Optional — when unset the captcha middleware is a no-op
  // (dev convenience). Wire the matching NEXT_PUBLIC_TURNSTILE_SITE_KEY
  // on the frontend; the widget only renders when both are present.
  TURNSTILE_SECRET_KEY: z.string().optional(),

  // Dev-only: auto-verify newly registered users so they can log in without
  // a working Resend setup. Ignored when NODE_ENV === 'production' so it
  // can't leak into a live deployment by accident.
  DEV_AUTO_VERIFY_EMAIL: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('❌ Missing or invalid environment variables:')
  const errors = result.error.flatten().fieldErrors
  Object.entries(errors).forEach(([key, messages]) => {
    console.error(`  ${key}: ${messages?.join(', ')}`)
  })
  process.exit(1)
}

export const env = result.data
export type Env = typeof env
