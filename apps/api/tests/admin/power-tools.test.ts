import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { randomUUID } from 'node:crypto'
import { app } from '../../src/index'
import { auth } from '../../src/lib/auth'
import { prisma } from '../../src/lib/prisma'
import { stripe } from '../../src/lib/stripe'
import {
  createBookingScenario,
  createTestArtist,
  createTestBid,
  createTestCaster,
  createTestJob,
  createTestPayment,
} from '../helpers/factories'
import { cleanupTestData } from '../helpers/cleanup'
import { resetStripeMockCalls, resetStripeMockState, stripeMockState } from '../helpers/stripe-mock'

const TEST_TIMEOUT = 60_000

beforeAll(async () => {
  await cleanupTestData()
})
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

describe('POST /api/v1/admin/payments/bookings/:id/release (force-release)', () => {
  it(
    'releases a held escrow, transfers to artist, writes AdminLog row',
    async () => {
      const { user: admin, cookie } = await createAuthedAdmin()
      const { booking, payment, artist } = await createBookingScenario({
        artistPayoutsEnabled: true,
        totalAmount: 1000,
      })

      const res = await app.request(
        `/api/v1/admin/payments/bookings/${booking.id}/release`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', cookie },
          body: JSON.stringify({ notes: 'caster unresponsive after 7 days; releasing manually' }),
        }
      )
      expect(res.status).toBe(200)
      const body = (await res.json()) as { success: boolean; data: { escrowStatus: string } }
      expect(body.success).toBe(true)
      expect(body.data.escrowStatus).toBe('released')

      // Stripe side effects: one capture, one transfer.
      expect(stripe.paymentIntents.capture).toHaveBeenCalledTimes(1)
      expect(stripe.transfers.create).toHaveBeenCalledTimes(1)
      expect(stripeMockState.transfers.at(-1)?.destination).toBe(artist.stripeAccountId)

      // DB: payment marked released, booking completed.
      const freshPayment = await prisma.payment.findUnique({ where: { id: payment.id } })
      expect(freshPayment?.escrowStatus).toBe('released')
      const freshBooking = await prisma.booking.findUnique({ where: { id: booking.id } })
      expect(freshBooking?.status).toBe('completed')

      // AdminLog row recorded.
      const log = await prisma.adminLog.findFirst({
        where: { adminId: admin.id, entityId: booking.id, action: 'force_release_escrow' },
      })
      expect(log).not.toBeNull()
      expect(log?.notes).toContain('caster unresponsive')
    },
    TEST_TIMEOUT
  )

  it(
    'rejects missing notes with VALIDATION_ERROR',
    async () => {
      const { cookie } = await createAuthedAdmin()
      const { booking } = await createBookingScenario({ artistPayoutsEnabled: true })

      const res = await app.request(
        `/api/v1/admin/payments/bookings/${booking.id}/release`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', cookie },
          body: JSON.stringify({ notes: '' }),
        }
      )
      expect(res.status).toBe(400)
      const body = (await res.json()) as { error: { code: string } }
      expect(body.error.code).toBe('VALIDATION_ERROR')
    },
    TEST_TIMEOUT
  )

  it(
    'non-admin caller is rejected with FORBIDDEN',
    async () => {
      // Use a caster session, not an admin one.
      const password = `P@ssw0rd-${randomUUID().slice(0, 6)}`
      const email = `caster-${randomUUID()}@castflow.test`
      await auth.api.signUpEmail({ body: { email, password, name: 'C' } })
      const u = await prisma.user.findUnique({ where: { email } })
      await prisma.user.update({
        where: { id: u!.id },
        data: { emailVerified: true, role: 'caster', status: 'active' },
      })
      const signIn = await auth.api.signInEmail({
        body: { email, password },
        asResponse: true,
      })
      const cookie = (signIn.headers.get('set-cookie') ?? '')
        .split(',')
        .map((s) => s.split(';')[0]?.trim())
        .join('; ')
      const { booking } = await createBookingScenario({ artistPayoutsEnabled: true })

      const res = await app.request(
        `/api/v1/admin/payments/bookings/${booking.id}/release`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', cookie },
          body: JSON.stringify({ notes: 'sneaky caster trying admin endpoint' }),
        }
      )
      expect(res.status).toBe(403)
    },
    TEST_TIMEOUT
  )
})

describe('POST /api/v1/admin/payments/bookings/:id/refund (force-refund)', () => {
  it(
    'cancels the payment intent, marks refunded, writes AdminLog',
    async () => {
      const { user: admin, cookie } = await createAuthedAdmin()
      const { booking, payment } = await createBookingScenario({
        artistPayoutsEnabled: true,
      })

      const res = await app.request(
        `/api/v1/admin/payments/bookings/${booking.id}/refund`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', cookie },
          body: JSON.stringify({ notes: 'shoot did not occur — refunding caster' }),
        }
      )
      expect(res.status).toBe(200)

      expect(stripe.paymentIntents.cancel).toHaveBeenCalledTimes(1)
      expect(stripe.transfers.create).not.toHaveBeenCalled()
      const freshPayment = await prisma.payment.findUnique({ where: { id: payment.id } })
      expect(freshPayment?.escrowStatus).toBe('refunded')
      const freshBooking = await prisma.booking.findUnique({ where: { id: booking.id } })
      expect(freshBooking?.status).toBe('cancelled')

      const log = await prisma.adminLog.findFirst({
        where: { adminId: admin.id, entityId: booking.id, action: 'force_refund_escrow' },
      })
      expect(log).not.toBeNull()
      expect(log?.notes).toContain('shoot did not occur')
    },
    TEST_TIMEOUT
  )
})

describe('POST /api/v1/admin/jobs/:id/remove (remove-job)', () => {
  it(
    'cancels job, expires open bids, refunds held escrows on attached bookings, writes AdminLog',
    async () => {
      const { user: admin, cookie } = await createAuthedAdmin()
      const { caster } = await createTestCaster()
      const job = await createTestJob({ casterId: caster.id })

      // Two pending bids that should expire.
      const { artist: artistA } = await createTestArtist()
      const { artist: artistB } = await createTestArtist()
      const bidA = await createTestBid({ jobId: job.id, artistId: artistA.id })
      const bidB = await createTestBid({
        jobId: job.id,
        artistId: artistB.id,
        status: 'shortlisted',
      })

      // One booking with held escrow that should refund.
      const { artist: artistC } = await createTestArtist({
        stripeAccountId: `acct_test_${randomUUID()}`,
        payoutsEnabled: true,
      })
      const bidC = await createTestBid({
        jobId: job.id,
        artistId: artistC.id,
        status: 'accepted',
      })
      const booking = await prisma.booking.create({
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
      const payment = await createTestPayment({ bookingId: booking.id, escrowStatus: 'held' })

      const res = await app.request(`/api/v1/admin/jobs/${job.id}/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie },
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

      // Escrow cascade-refunded.
      const freshPayment = await prisma.payment.findUnique({ where: { id: payment.id } })
      expect(freshPayment?.escrowStatus).toBe('refunded')
      expect(stripe.paymentIntents.cancel).toHaveBeenCalledTimes(1)

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
        headers: { 'Content-Type': 'application/json', cookie },
        body: JSON.stringify({ reason: 'no' }),
      })
      expect(res.status).toBe(400)
    },
    TEST_TIMEOUT
  )
})
