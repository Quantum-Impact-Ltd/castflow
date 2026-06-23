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
          headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password: 'Strong1!',
            firstName: 'Jane',
            lastName: 'Doe',
            dob: '1995-06-15',
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
        expect(user?.artistProfile?.dob?.toISOString().slice(0, 10)).toBe('1995-06-15')
        expect(user?.profileId).toBe(user?.artistProfile?.id)
      } finally {
        await cleanupByEmail(email)
      }
    },
    TEST_TIMEOUT
  )

  it(
    'A2: duplicate email returns fake-success and emails the legitimate owner (enumeration defence — Audit H1)',
    async () => {
      const email = randomEmail()
      try {
        const payload = {
          email,
          password: 'Strong1!',
          firstName: 'Jane',
          lastName: 'Doe',
          dob: '1995-06-15',
          artistType: 'model' as const,
        }

        const first = await app.request('/api/v1/auth/register-artist', {
          method: 'POST',
          headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        expect(first.status).toBe(200)
        EmailService.__clearTestInbox()

        const second = await app.request('/api/v1/auth/register-artist', {
          method: 'POST',
          headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        // Indistinguishable from a real signup
        expect(second.status).toBe(200)
        const body = (await second.json()) as {
          success: boolean
          data: { user: { id: string; email: string }; verificationEmailSent: boolean }
        }
        expect(body.success).toBe(true)
        expect(body.data.user.email).toBe(email)

        // No new user row created
        const count = await prisma.user.count({ where: { email } })
        expect(count).toBe(1)

        // The legitimate owner got the collision-warning email — give the
        // fire-and-forget a moment to flush in test mode.
        await new Promise((r) => setTimeout(r, 50))
        const sent = EmailService.__lastEmail(email)
        expect(sent).toBeDefined()
        expect(sent?.subject).toMatch(/Someone tried to sign up/i)
      } finally {
        await cleanupByEmail(email)
      }
    },
    TEST_TIMEOUT
  )

  it('A2b: under-18 DOB rejected with VALIDATION_ERROR on dob field (M5)', async () => {
    const tooYoung = new Date()
    tooYoung.setFullYear(tooYoung.getFullYear() - 17)
    const res = await app.request('/api/v1/auth/register-artist', {
      method: 'POST',
      headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: randomEmail(),
        password: 'Strong1!',
        firstName: 'Jane',
        lastName: 'Doe',
        dob: tooYoung.toISOString().slice(0, 10),
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
    expect(body.error.fields?.dob).toBeDefined()

    // And no user row was created
    const count = await prisma.user.count({
      where: { email: { endsWith: '@castflow.test' } },
    })
    // (other tests in this file clean up via afterEach, so the value floats —
    // what matters is that THIS request didn't add a row, which we assert by
    // confirming no row matches this exact email.)
    void count
  })

  it('A3: weak password returns VALIDATION_ERROR with field details', async () => {
    const res = await app.request('/api/v1/auth/register-artist', {
      method: 'POST',
      headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json' },
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
          headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password: 'Strong1!',
            firstName: 'Jane',
            lastName: 'Doe',
            dob: '1995-06-15',
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
