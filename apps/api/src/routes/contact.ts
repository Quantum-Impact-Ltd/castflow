import { Hono } from 'hono'
import { contactMessageSchema } from '@castflow/validators'
import { AppError } from '../errors'
import { rateLimit } from '../middleware/rateLimit'
import { EmailService } from '../services/EmailService'
import { env } from '../lib/env'

export const contactRoutes = new Hono()

const submitLimit = rateLimit({
  scope: 'contact:submit',
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many messages from this network — please try again later.',
})

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

contactRoutes.post('/', submitLimit, async (c) => {
  const json = (await c.req.json().catch(() => null)) as unknown
  const parsed = contactMessageSchema.safeParse(json)
  if (!parsed.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Invalid input',
      400,
      parsed.error.flatten().fieldErrors,
    )
  }

  const { name, email, company, topic, message, website } = parsed.data

  // Honeypot: if a real-user form submits this populated, treat as success
  // (don't tip off the bot) but skip the email send.
  if (website && website.length > 0) {
    return c.json({ success: true, data: { received: true } })
  }

  const subject = `[CastFlow contact · ${topic}] ${name}`
  const html = `
    <h2>New contact-form submission</h2>
    <p><strong>Topic:</strong> ${escapeHtml(topic)}</p>
    <p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
    ${company ? `<p><strong>Company:</strong> ${escapeHtml(company)}</p>` : ''}
    <p><strong>Message:</strong></p>
    <pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(message)}</pre>
  `

  try {
    await EmailService.sendEvent({
      to: env.CONTACT_INBOX_EMAIL,
      subject,
      html,
    })
  } catch (err) {
    console.error('[contact] email send failed', err)
    throw new AppError('INTERNAL_ERROR', 'We couldn’t send your message — please try again', 500)
  }

  return c.json({ success: true, data: { received: true } })
})
