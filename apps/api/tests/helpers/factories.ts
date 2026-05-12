/**
 * DB factories for integration tests. Every factory creates rows with a
 * `@castflow.test` email convention so `cleanupTestData()` can wipe them
 * by suffix without touching seed/dev data.
 *
 * Stripe-touching factories also seed the Stripe mock state so
 * `getConnectStatus` / `releaseEscrow` gating returns the desired branch
 * without requiring callers to wire up the mock by hand.
 */
import { randomUUID } from 'node:crypto'
import { prisma } from '../../src/lib/prisma'
import { seedConnectAccount, seedPaymentIntent } from './stripe-mock'

export const TEST_EMAIL_DOMAIN = 'castflow.test'

export function testEmail(prefix = 'user'): string {
  return `${prefix}-${randomUUID()}@${TEST_EMAIL_DOMAIN}`
}

// ──────────────────────────────────────────────────────────────────────────
// Users + profiles
// ──────────────────────────────────────────────────────────────────────────

interface UserOpts {
  email?: string
  name?: string
  status?: 'active' | 'suspended' | 'banned' | 'pending'
}

async function createUserRow(role: 'admin' | 'caster' | 'artist', opts: UserOpts = {}) {
  const id = `usr_${randomUUID()}`
  const email = opts.email ?? testEmail(role)
  return prisma.user.create({
    data: {
      id,
      email,
      name: opts.name ?? `Test ${role}`,
      role,
      status: opts.status ?? 'active',
      emailVerified: true,
    },
  })
}

export async function createTestAdmin(opts: UserOpts = {}) {
  return createUserRow('admin', opts)
}

interface CasterOpts extends UserOpts {
  companyName?: string
  companyType?: 'brand' | 'agency' | 'production_house' | 'independent'
}

export async function createTestCaster(opts: CasterOpts = {}) {
  const user = await createUserRow('caster', opts)
  const caster = await prisma.casterProfile.create({
    data: {
      userId: user.id,
      companyName: opts.companyName ?? 'Test Brand Ltd',
      companyType: opts.companyType ?? 'brand',
      contactName: opts.name ?? 'Test Caster',
    },
  })
  await prisma.user.update({
    where: { id: user.id },
    data: { profileId: caster.id, approvalStatus: 'approved' },
  })
  return { user, caster }
}

interface ArtistOpts extends UserOpts {
  firstName?: string
  lastName?: string
  artistType?: 'model' | 'actor'
  approvalStatus?: 'pending' | 'approved' | 'rejected'
  stripeAccountId?: string | null
  payoutsEnabled?: boolean
}

export async function createTestArtist(opts: ArtistOpts = {}) {
  const user = await createUserRow('artist', opts)
  const stripeAccountId = opts.stripeAccountId === null ? null : opts.stripeAccountId ?? null
  const artist = await prisma.artistProfile.create({
    data: {
      userId: user.id,
      firstName: opts.firstName ?? 'Test',
      lastName: opts.lastName ?? 'Artist',
      artistType: opts.artistType ?? 'model',
      approvalStatus: opts.approvalStatus ?? 'approved',
      ...(stripeAccountId ? { stripeAccountId } : {}),
      payoutsEnabled: opts.payoutsEnabled ?? false,
    },
  })
  await prisma.user.update({
    where: { id: user.id },
    data: {
      profileId: artist.id,
      approvalStatus: opts.approvalStatus ?? 'approved',
    },
  })
  // Mirror the artist's Connect state into the Stripe mock so downstream
  // `stripe.accounts.retrieve` reads return the same answer the DB cache holds.
  if (stripeAccountId) {
    seedConnectAccount({ id: stripeAccountId, payoutsEnabled: opts.payoutsEnabled ?? false })
  }
  return { user, artist }
}

// ──────────────────────────────────────────────────────────────────────────
// Job / Bid / Booking / Payment
// ──────────────────────────────────────────────────────────────────────────

interface JobOpts {
  casterId: string
  status?: 'active' | 'filled' | 'expired' | 'cancelled' | 'closed' | 'draft'
  visibility?: 'public' | 'invite_only'
  paymentType?: 'fixed' | 'hourly'
  rateAmount?: number
  shootDate?: Date
  applicationDeadline?: Date
  shootLocationDetail?: string
  callTime?: Date
}

export async function createTestJob(opts: JobOpts) {
  const shootDate = opts.shootDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  const applicationDeadline = opts.applicationDeadline ?? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  return prisma.job.create({
    data: {
      casterId: opts.casterId,
      title: 'Test shoot',
      description: 'Test shoot description',
      category: 'model',
      genderRequired: 'female',
      locationCity: 'London',
      shootDate,
      shootEndDate: shootDate,
      shootDurationHours: 8,
      ...(opts.callTime ? { callTime: opts.callTime } : {}),
      shootLocationDetail: opts.shootLocationDetail ?? '21 Test Street, EC1 2AB',
      paymentType: opts.paymentType ?? 'fixed',
      rateSetBy: 'caster',
      rateAmount: opts.rateAmount ?? 500,
      usageRights: 'editorial-only',
      applicationDeadline,
      autoExpiresAt: applicationDeadline,
      headcountRequired: 1,
      status: opts.status ?? 'active',
      visibility: opts.visibility ?? 'public',
    },
  })
}

interface BidOpts {
  jobId: string
  artistId: string
  proposedRate?: number
  status?: 'pending' | 'shortlisted' | 'rejected' | 'accepted' | 'withdrawn' | 'expired'
}

export async function createTestBid(opts: BidOpts) {
  return prisma.bid.create({
    data: {
      jobId: opts.jobId,
      artistId: opts.artistId,
      proposedRate: opts.proposedRate ?? 500,
      coverNote: 'I am available and excited to work on this shoot.',
      highlightedPortfolioItems: [],
      status: opts.status ?? 'pending',
    },
  })
}

interface BookingOpts {
  jobId: string
  bidId: string
  casterId: string
  artistId: string
  shootDate?: Date
  shootLocation?: string
  totalAmount?: number
  agreedRate?: number
  status?:
    | 'pending_payment'
    | 'confirmed'
    | 'completed'
    | 'cancelled'
    | 'disputed'
  paymentType?: 'fixed' | 'hourly'
}

export async function createTestBooking(opts: BookingOpts) {
  const shootDate = opts.shootDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  return prisma.booking.create({
    data: {
      jobId: opts.jobId,
      bidId: opts.bidId,
      casterId: opts.casterId,
      artistId: opts.artistId,
      paymentType: opts.paymentType ?? 'fixed',
      agreedRate: opts.agreedRate ?? 500,
      totalAmount: opts.totalAmount ?? 500,
      shootDate,
      shootLocation: opts.shootLocation ?? '21 Test Street, EC1 2AB',
      status: opts.status ?? 'confirmed',
    },
  })
}

interface PaymentOpts {
  bookingId: string
  stripePaymentIntentId?: string
  stripeChargeId?: string | null
  grossAmount?: number
  commissionRate?: number
  escrowStatus?:
    | 'awaiting_payment'
    | 'held'
    | 'released'
    | 'refunded'
    | 'partially_refunded'
    | 'disputed'
  autoReleaseAt?: Date
}

export async function createTestPayment(opts: PaymentOpts) {
  const gross = opts.grossAmount ?? 500
  const rate = opts.commissionRate ?? 15
  const commission = Math.round(gross * rate) / 100
  const net = Math.round((gross - commission) * 100) / 100
  const intentId = opts.stripePaymentIntentId ?? `pi_test_${randomUUID()}`
  // Mirror the intent into the Stripe mock so PaymentService.releaseEscrow /
  // partialRelease / refundEscrow find it when they capture/cancel.
  seedPaymentIntent({ id: intentId, amount: Math.round(gross * 100) })
  return prisma.payment.create({
    data: {
      bookingId: opts.bookingId,
      stripePaymentIntentId: intentId,
      stripeChargeId: opts.stripeChargeId === null ? null : opts.stripeChargeId ?? `ch_test_${randomUUID()}`,
      grossAmount: gross,
      platformCommissionRate: rate,
      platformCommissionAmount: commission,
      netArtistAmount: net,
      escrowStatus: opts.escrowStatus ?? 'held',
      autoReleaseAt: opts.autoReleaseAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paidAt: new Date(),
    },
  })
}

interface ContractOpts {
  bookingId: string
  status?: 'pending_signatures' | 'partially_signed' | 'fully_signed' | 'voided'
  artistLegalName?: string
  casterCompanyName?: string
  jobTitle?: string
  shootDate?: Date
  shootLocation?: string
}

export async function createTestContract(opts: ContractOpts) {
  const shootDate = opts.shootDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  return prisma.contract.create({
    data: {
      bookingId: opts.bookingId,
      status: opts.status ?? 'pending_signatures',
      artistLegalName: opts.artistLegalName ?? 'Test Artist',
      casterCompanyName: opts.casterCompanyName ?? 'Test Brand Ltd',
      jobTitle: opts.jobTitle ?? 'Test shoot',
      shootDate,
      shootLocation: opts.shootLocation ?? '21 Test Street, EC1 2AB',
      paymentType: 'fixed',
      agreedRate: 500,
      totalAmount: 500,
      paymentTerms: 'Funds held in escrow; released on completion.',
      usageRights: 'editorial-only',
      exclusivity: false,
      ndaIncluded: false,
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────
// Convenience: end-to-end "ready booking" scenario
// ──────────────────────────────────────────────────────────────────────────

interface ScenarioOpts {
  artistPayoutsEnabled?: boolean
  artistStripeAccountId?: string | null
  escrowStatus?: PaymentOpts['escrowStatus']
  bookingStatus?: BookingOpts['status']
  totalAmount?: number
  shootDate?: Date
  contractStatus?: ContractOpts['status']
}

/**
 * Create a fully populated booking scenario in one call:
 * caster + artist + job + bid + booking + payment + contract.
 *
 * Use as the default starting point for money-flow tests — override only
 * the fields a given test cares about.
 */
export async function createBookingScenario(opts: ScenarioOpts = {}) {
  const { caster, user: casterUser } = await createTestCaster()
  const stripeAccountId =
    opts.artistStripeAccountId === null
      ? null
      : opts.artistStripeAccountId ?? `acct_test_${randomUUID()}`
  const { artist, user: artistUser } = await createTestArtist({
    stripeAccountId,
    payoutsEnabled: opts.artistPayoutsEnabled ?? false,
  })
  const job = await createTestJob({ casterId: caster.id, shootDate: opts.shootDate })
  const bid = await createTestBid({ jobId: job.id, artistId: artist.id, status: 'accepted' })
  const booking = await createTestBooking({
    jobId: job.id,
    bidId: bid.id,
    casterId: caster.id,
    artistId: artist.id,
    totalAmount: opts.totalAmount ?? 500,
    shootDate: opts.shootDate,
    status: opts.bookingStatus ?? 'confirmed',
  })
  const payment = await createTestPayment({
    bookingId: booking.id,
    grossAmount: opts.totalAmount ?? 500,
    escrowStatus: opts.escrowStatus ?? 'held',
  })
  const contract = opts.contractStatus
    ? await createTestContract({ bookingId: booking.id, status: opts.contractStatus })
    : null
  return { casterUser, caster, artistUser, artist, job, bid, booking, payment, contract }
}
