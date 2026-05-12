import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { JobService } from '../src/services/JobService'
import { JobInviteService } from '../src/services/JobInviteService'
import { BookingService } from '../src/services/BookingService'
import { app } from '../src/index'
import { auth } from '../src/lib/auth'
import { prisma } from '../src/lib/prisma'
import { randomUUID } from 'node:crypto'
import {
  createBookingScenario,
  createTestArtist,
  createTestCaster,
  createTestJob,
} from './helpers/factories'
import { cleanupTestData } from './helpers/cleanup'
import { resetStripeMockCalls, resetStripeMockState } from './helpers/stripe-mock'

const TEST_TIMEOUT = 30_000

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

describe('Sensitive field gating', () => {
  describe('JobService.getPublicDetail', () => {
    it(
      'strips shootLocationDetail and callTime from the public job feed entry',
      async () => {
        const { caster } = await createTestCaster()
        const callTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        const job = await createTestJob({
          casterId: caster.id,
          shootLocationDetail: 'SECRET — Studio C, 42 Acme St, EC1 9XY',
          callTime,
        })

        const detail = await JobService.getPublicDetail(job.id)
        expect(detail.shootLocationDetail).toBeNull()
        expect(detail.callTime).toBeNull()
        // Public fields still present.
        expect(detail.title).toBe('Test shoot')
        expect(detail.locationCity).toBe('London')
      },
      TEST_TIMEOUT
    )
  })

  describe('JobInviteService.getForArtist', () => {
    it(
      'unconditionally returns shootLocationDetail=null and callTime=null even on an invite (pre-booking)',
      async () => {
        const { caster } = await createTestCaster()
        const { artist, user: artistUser } = await createTestArtist()
        const callTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        const job = await createTestJob({
          casterId: caster.id,
          shootLocationDetail: 'SECRET STUDIO',
          callTime,
          visibility: 'invite_only',
        })
        const invite = await prisma.jobInvite.create({
          data: { jobId: job.id, artistId: artist.id, status: 'pending' },
        })

        const result = await JobInviteService.getForArtist(artistUser.id, invite.id)
        expect(result.job.shootLocationDetail).toBeNull()
        expect(result.job.callTime).toBeNull()
        // The invite itself still shows the artist what they need.
        expect(result.status).toBe('pending')
      },
      TEST_TIMEOUT
    )
  })

  describe('BookingService.getById', () => {
    it(
      'strips shootLocation + callTime when contract is not fully_signed',
      async () => {
        const { booking, casterUser } = await createBookingScenario({
          artistPayoutsEnabled: true,
          contractStatus: 'pending_signatures',
        })

        const result = await BookingService.getById(
          { id: casterUser.id, role: 'caster' },
          booking.id
        )
        expect(result.shootLocation).toBe('')
        expect(result.callTime).toBeNull()
      },
      TEST_TIMEOUT
    )

    it(
      'reveals shootLocation + callTime once contract is fully_signed',
      async () => {
        const callTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        const { booking, casterUser } = await createBookingScenario({
          artistPayoutsEnabled: true,
          contractStatus: 'fully_signed',
        })
        // Backfill a callTime on the booking so we can assert it's revealed.
        await prisma.booking.update({
          where: { id: booking.id },
          data: { callTime },
        })

        const result = await BookingService.getById(
          { id: casterUser.id, role: 'caster' },
          booking.id
        )
        expect(result.shootLocation).toBe('21 Test Street, EC1 2AB')
        expect(result.callTime?.toISOString()).toBe(callTime.toISOString())
      },
      TEST_TIMEOUT
    )
  })

  describe('GET /api/v1/talent/:id', () => {
    /**
     * Hit the route via app.request so the explicit `select:` shape on the
     * Prisma query is exercised end-to-end. The response must not include
     * `lastName / dob / idDocumentUrl / userId / approvalNotes / strikeCount /
     * approvedById`.
     */
    it(
      'omits sensitive PII (lastName, dob, idDocumentUrl, userId, approvalNotes, strikeCount)',
      async () => {
        // Caster + signed-in session via Better Auth.
        const password = `P@ssw0rd-${randomUUID().slice(0, 6)}`
        const casterEmail = `caster-${randomUUID()}@castflow.test`
        await auth.api.signUpEmail({
          body: {
            email: casterEmail,
            password,
            name: 'Test Caster',
          },
        })
        const casterUser = await prisma.user.findUnique({ where: { email: casterEmail } })
        if (!casterUser) throw new Error('failed to create caster user')
        // Better Auth's account-enumeration protection: the verification flow
        // sets emailVerified=false. Mark verified so the session works.
        await prisma.user.update({
          where: { id: casterUser.id },
          data: { emailVerified: true, role: 'caster', status: 'active' },
        })
        const caster = await prisma.casterProfile.create({
          data: {
            userId: casterUser.id,
            companyName: 'Test Studio',
            companyType: 'brand',
            contactName: 'Caster',
          },
        })
        await prisma.user.update({
          where: { id: casterUser.id },
          data: { profileId: caster.id, approvalStatus: 'approved' },
        })

        const signIn = await auth.api.signInEmail({
          body: { email: casterEmail, password },
          asResponse: true,
        })
        const setCookie = signIn.headers.get('set-cookie') ?? ''
        // Extract the better-auth session cookie from the Set-Cookie header.
        const sessionCookie = setCookie.split(',').map((s) => s.split(';')[0]?.trim()).join('; ')

        // Target an approved artist with sensitive PII populated.
        const { artist } = await createTestArtist({
          firstName: 'Public',
          lastName: 'PRIVATE_SURNAME',
          approvalStatus: 'approved',
        })
        await prisma.artistProfile.update({
          where: { id: artist.id },
          data: {
            dob: new Date('1995-01-01'),
            idDocumentUrl: 'https://private.bucket/id-docs/secret.jpg',
            approvalNotes: 'admin-only notes',
            strikeCount: 2,
          },
        })

        const res = await app.request(`/api/v1/talent/${artist.id}`, {
          headers: { cookie: sessionCookie },
        })
        expect(res.status).toBe(200)
        const body = (await res.json()) as {
          success: boolean
          data: Record<string, unknown>
        }
        expect(body.success).toBe(true)
        const data = body.data
        expect(data.id).toBe(artist.id)
        expect(data.firstName).toBe('Public')

        // Sensitive fields must NOT be present at all.
        expect('lastName' in data).toBe(false)
        expect('dob' in data).toBe(false)
        expect('idDocumentUrl' in data).toBe(false)
        expect('userId' in data).toBe(false)
        expect('approvalNotes' in data).toBe(false)
        expect('strikeCount' in data).toBe(false)
        expect('approvedById' in data).toBe(false)
      },
      TEST_TIMEOUT
    )
  })
})
