import { resend } from '../lib/resend'
import { env } from '../lib/env'
import { prisma } from '../lib/prisma'

interface SentEmail {
  to: string
  subject: string
  html: string
  sentAt: Date
}

const testInbox: SentEmail[] = []

interface SendArgs {
  to: string
  subject: string
  html: string
}

async function send({ to, subject, html }: SendArgs): Promise<void> {
  if (env.NODE_ENV === 'test') {
    testInbox.push({ to, subject, html, sentAt: new Date() })
    return
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
  })

  if (error) {
    console.error('[EmailService] Resend error:', error)
  }
}

export interface SendVerificationArgs {
  to: string
  verifyUrl: string
}

export interface SendPasswordResetArgs {
  to: string
  resetUrl: string
}

export interface SendWelcomeArgs {
  to: string
  role: 'artist' | 'caster'
  firstName: string
}

export class EmailService {
  protected static readonly db = prisma

  static async sendVerificationEmail({ to, verifyUrl }: SendVerificationArgs): Promise<void> {
    const html = `
      <h1>Welcome to CastFlow</h1>
      <p>Click the link below to verify your email address:</p>
      <p><a href="${verifyUrl}">Verify my email</a></p>
      <p>This link expires in 24 hours. If you didn't sign up, you can ignore this email.</p>
    `
    await send({ to, subject: 'Verify your CastFlow email', html })
  }

  static async sendPasswordReset({ to, resetUrl }: SendPasswordResetArgs): Promise<void> {
    const html = `
      <h1>Reset your CastFlow password</h1>
      <p>Click the link below to set a new password:</p>
      <p><a href="${resetUrl}">Reset password</a></p>
      <p>This link expires in 1 hour. If you didn't request a reset, you can safely ignore this email.</p>
    `
    await send({ to, subject: 'Reset your CastFlow password', html })
  }

  /**
   * Fired when someone attempts to register with an email that already has
   * an account. Lets the legitimate owner know without revealing to the
   * attempting party that the email exists (we return a fake-success
   * response in that path so account enumeration is blocked). (Audit H1.)
   */
  static async sendRegistrationCollisionEmail({ to }: { to: string }): Promise<void> {
    const loginUrl = `${env.FRONTEND_URL}/login`
    const resetUrl = `${env.FRONTEND_URL}/forgot-password`
    const html = `
      <h1>Someone tried to sign up with your email</h1>
      <p>We received a registration attempt for an account that already
        belongs to you. If this was you trying to sign in, head to the
        login page:</p>
      <p><a href="${loginUrl}">Log in to CastFlow</a></p>
      <p>If you've forgotten your password, you can reset it here:</p>
      <p><a href="${resetUrl}">Reset password</a></p>
      <p>If this wasn't you, you can ignore this email — your account is
        safe and nothing has changed.</p>
    `
    await send({ to, subject: 'Someone tried to sign up with your email', html })
  }

  static async sendWelcomeEmail({ to, role, firstName }: SendWelcomeArgs): Promise<void> {
    const ctaUrl =
      role === 'artist' ? `${env.FRONTEND_URL}/onboarding` : `${env.FRONTEND_URL}/caster/dashboard`
    const ctaText = role === 'artist' ? 'Complete your profile' : 'Go to your dashboard'

    const html = `
      <h1>Welcome to CastFlow, ${firstName}!</h1>
      <p>Your email has been verified. You're ready to get started.</p>
      <p><a href="${ctaUrl}">${ctaText}</a></p>
    `
    await send({ to, subject: 'Welcome to CastFlow', html })
  }

  /**
   * Generic event email. Used by NotificationService.notifyEvent so each
   * service event has one call site (in-app + email together).
   */
  static async sendEvent({
    to,
    subject,
    html,
  }: {
    to: string
    subject: string
    html: string
  }): Promise<void> {
    await send({ to, subject, html })
  }

  // Test helpers — only meaningful when NODE_ENV === 'test'
  static __testInbox(): readonly SentEmail[] {
    return testInbox
  }

  static __clearTestInbox(): void {
    testInbox.length = 0
  }

  static __lastEmail(to?: string): SentEmail | undefined {
    const matches = to ? testInbox.filter((e) => e.to === to) : testInbox
    return matches[matches.length - 1]
  }
}
