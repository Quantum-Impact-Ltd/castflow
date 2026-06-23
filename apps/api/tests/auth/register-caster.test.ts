import { describe, expect, it, afterEach } from 'bun:test'
import { app } from '../../src/index'
import { prisma } from '../../src/lib/prisma'

function randomEmail(): string {
  return `test-${crypto.randomUUID()}@castflow.test`
}

const companyTypes = ['brand', 'agency', 'production_house', 'independent'] as const

const TEST_TIMEOUT = 30_000

describe('POST /api/v1/auth/register-caster', () => {
  it(
    'A7: valid input creates user + CasterProfile',
    async () => {
      const email = randomEmail()
      try {
        const res = await app.request('/api/v1/auth/register-caster', {
          method: 'POST',
          headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password: 'Strong1!',
            companyName: 'Acme',
            companyType: 'brand',
            contactName: 'Pat',
          }),
        })

        expect(res.status).toBe(200)
        const body = (await res.json()) as { success: boolean }
        expect(body.success).toBe(true)

        const user = await prisma.user.findUnique({
          where: { email },
          include: { casterProfile: true },
        })
        expect(user?.role).toBe('caster')
        expect(user?.status).toBe('active')
        expect(user?.casterProfile?.companyName).toBe('Acme')
        expect(user?.profileId).toBe(user?.casterProfile?.id)
      } finally {
        const u = await prisma.user.findUnique({ where: { email }, select: { id: true } })
        if (u) await prisma.user.delete({ where: { id: u.id } })
      }
    },
    TEST_TIMEOUT
  )

  it.each(companyTypes)(
    'A8: accepts companyType=%s',
    async (companyType) => {
      const email = randomEmail()
      try {
        const res = await app.request('/api/v1/auth/register-caster', {
          method: 'POST',
          headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password: 'Strong1!',
            companyName: 'Acme',
            companyType,
            contactName: 'Pat',
          }),
        })
        expect(res.status).toBe(200)
      } finally {
        const u = await prisma.user.findUnique({ where: { email }, select: { id: true } })
        if (u) await prisma.user.delete({ where: { id: u.id } })
      }
    },
    TEST_TIMEOUT
  )
})

afterEach(async () => {
  await prisma.user.deleteMany({
    where: { email: { endsWith: '@castflow.test' } },
  })
})
