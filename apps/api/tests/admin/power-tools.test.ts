import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { randomUUID } from 'node:crypto'
import { app } from '../../src/index'
import { auth } from '../../src/lib/auth'
import { prisma } from '../../src/lib/prisma'
import {
  createTestArtist,
  createTestBid,
  createTestCaster,
  createTestJob,
} from '../helpers/factories'
import { cleanupTestData } from '../helpers/cleanup'
import { resetStripeMockCalls, resetStripeMockState } from '../helpers/stripe-mock'

const TEST_TIMEOUT = 60_000

beforeAll(async () => {
  await cleanupTestData()
}, 60_000)
beforeEach(() => {
  resetStripeMockCalls()
  resetStripeMockState()
})
afterAll(async () => {
  await cleanupTestData()
}, 60_000)

/**
 * Sign up + sign in an admin via Better Auth, return the user row and the
 * Set-Cookie header that `app.request` can re-send for authenticated calls.
 * Mirrors the pattern in `tests/sensitive-fields.test.ts`.
 */
async function createAuthedAdmin() {
  const password = `P@ssw0rd-${randomUUID().slice(0, 6)}`
  const email = `admin-${randomUUID()}@castflow.test`
  await auth.api.signUpEmail({
    body: { email, password, name: 'Test Admin' },
  })
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error('failed to create admin user')
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, role: 'admin', status: 'active' },
  })
  const signIn = await auth.api.signInEmail({
    body: { email, password },
    asResponse: true,
  })
  const setCookie = signIn.headers.get('set-cookie') ?? ''
  const cookie = setCookie.split(',').map((s) => s.split(';')[0]?.trim()).join('; ')
  return { user, cookie }
}

describe('POST /api/v1/admin/jobs/:id/remove (remove-job)', () => {
  it(
    'cancels job, expires open bids, leaves accepted bids, writes AdminLog',
    async () => {
      const { user: admin, cookie } = await createAuthedAdmin()
      const { caster } = await createTestCaster()
      const job = await createTestJob({ casterId: caster.id })

      // Two open bids that should expire.
      const { artist: artistA } = await createTestArtist()
      const { artist: artistB } = await createTestArtist()
      const bidA = await createTestBid({ jobId: job.id, artistId: artistA.id })
      const bidB = await createTestBid({
        jobId: job.id,
        artistId: artistB.id,
        status: 'shortlisted',
      })

      // One accepted bid + booking that should NOT change. The platform holds
      // no job money, so there is nothing to refund.
      const { artist: artistC } = await createTestArtist()
      const bidC = await createTestBid({
        jobId: job.id,
        artistId: artistC.id,
        status: 'accepted',
      })
      await prisma.booking.create({
        data: {
          jobId: job.id,
          bidId: bidC.id,
          casterId: caster.id,
          artistId: artistC.id,
          paymentType: 'fixed',
          agreedRate: 500,
          totalAmount: 500,
          shootDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          shootLocation: 'somewhere',
          status: 'confirmed',
        },
      })

      const res = await app.request(`/api/v1/admin/jobs/${job.id}/remove`, {
        method: 'POST',
        headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json', cookie },
        body: JSON.stringify({ reason: 'ToS violation: explicit content brief' }),
      })
      expect(res.status).toBe(200)

      const freshJob = await prisma.job.findUnique({ where: { id: job.id } })
      expect(freshJob?.status).toBe('cancelled')

      const freshBids = await prisma.bid.findMany({ where: { jobId: job.id } })
      const byId = Object.fromEntries(freshBids.map((b) => [b.id, b.status]))
      expect(byId[bidA.id]).toBe('expired')
      expect(byId[bidB.id]).toBe('expired')
      // bidC was 'accepted' — adminRemove only flips pending/shortlisted.
      expect(byId[bidC.id]).toBe('accepted')

      const log = await prisma.adminLog.findFirst({
        where: { adminId: admin.id, entityId: job.id, action: 'remove_job' },
      })
      expect(log).not.toBeNull()
      expect(log?.notes).toContain('ToS violation')
    },
    TEST_TIMEOUT
  )

  it(
    'rejects too-short reason with VALIDATION_ERROR',
    async () => {
      const { cookie } = await createAuthedAdmin()
      const { caster } = await createTestCaster()
      const job = await createTestJob({ casterId: caster.id })

      const res = await app.request(`/api/v1/admin/jobs/${job.id}/remove`, {
        method: 'POST',
        headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json', cookie },
        body: JSON.stringify({ reason: 'no' }),
      })
      expect(res.status).toBe(400)
    },
    TEST_TIMEOUT
  )
})
