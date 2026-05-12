import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import { app } from '../../src/index'
import { prisma } from '../../src/lib/prisma'
import { EmailService } from '../../src/services/EmailService'

function randomEmail(): string {
  return `test-${crypto.randomUUID()}@castflow.test`
}

async function cleanupByEmail(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (!user) return
  await prisma.user.delete({ where: { id: user.id } })
}

beforeEach(() => {
  EmailService.__clearTestInbox()
})

const TEST_TIMEOUT = 30_000

describe('POST /api/v1/auth/register-artist', () => {
  it(
    'A1: valid input creates user + ArtistProfile, returns success envelope',
    async () => {
      const email = randomEmail()
      try {
        const res = await app.request('/api/v1/auth/register-artist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password: 'Strong1!',
            firstName: 'Jane',
            lastName: 'Doe',
            artistType: 'model',
          }),
        })

        expect(res.status).toBe(200)
        const body = (await res.json()) as {
          success: boolean
          data: { user: { id: string; email: string }; verificationEmailSent: boolean }
        }
        expect(body.success).toBe(true)
        expect(body.data.user.email).toBe(email)
        expect(body.data.verificationEmailSent).toBe(true)

        const user = await prisma.user.findUnique({
          where: { email },
          include: { artistProfile: true },
        })
        expect(user).not.toBeNull()
        expect(user?.role).toBe('artist')
        expect(user?.approvalStatus).toBe('pending')
        expect(user?.artistProfile).not.toBeNull()
        expect(user?.artistProfile?.firstName).toBe('Jane')
        expect(user?.artistProfile?.lastName).toBe('Doe')
        expect(user?.artistProfile?.artistType).toBe('model')
        expect(user?.profileId).toBe(user?.artistProfile?.id)
      } finally {
        await cleanupByEmail(email)
      }
    },
    TEST_TIMEOUT
  )

  it(
    'A2: duplicate email returns EMAIL_TAKEN',
    async () => {
      const email = randomEmail()
      try {
        const payload = {
          email,
          password: 'Strong1!',
          firstName: 'Jane',
          lastName: 'Doe',
          artistType: 'model' as const,
        }

        const first = await app.request('/api/v1/auth/register-artist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        expect(first.status).toBe(200)

        const second = await app.request('/api/v1/auth/register-artist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        expect(second.status).toBe(409)
        const body = (await second.json()) as { success: boolean; error: { code: string } }
        expect(body.success).toBe(false)
        expect(body.error.code).toBe('EMAIL_TAKEN')

        const count = await prisma.user.count({ where: { email } })
        expect(count).toBe(1)
      } finally {
        await cleanupByEmail(email)
      }
    },
    TEST_TIMEOUT
  )

  it('A3: weak password returns VALIDATION_ERROR with field details', async () => {
    const res = await app.request('/api/v1/auth/register-artist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: randomEmail(),
        password: 'weak',
        firstName: 'Jane',
        lastName: 'Doe',
        artistType: 'model',
      }),
    })

    expect(res.status).toBe(400)
    const body = (await res.json()) as {
      success: boolean
      error: { code: string; fields?: Record<string, string[]> }
    }
    expect(body.success).toBe(false)
    expect(body.error.code).toBe('VALIDATION_ERROR')
    expect(body.error.fields?.password).toBeDefined()
  })

  it(
    'A6: verification email is dispatched to the new user',
    async () => {
      const email = randomEmail()
      try {
        const res = await app.request('/api/v1/auth/register-artist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password: 'Strong1!',
            firstName: 'Jane',
            lastName: 'Doe',
            artistType: 'model',
          }),
        })
        expect(res.status).toBe(200)

        const lastEmail = EmailService.__lastEmail(email)
        expect(lastEmail).toBeDefined()
        expect(lastEmail?.subject).toMatch(/verify/i)
      } finally {
        await cleanupByEmail(email)
      }
    },
    TEST_TIMEOUT
  )
})

afterEach(async () => {
  // Ensure tests don't leave orphaned users if a test threw before cleanup.
  await prisma.user.deleteMany({
    where: { email: { endsWith: '@castflow.test' } },
  })
})
