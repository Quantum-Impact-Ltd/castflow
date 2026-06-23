/**
 * DB factories for integration tests. Every factory creates rows with a
 * `@castflow.test` email convention so `cleanupTestData()` can wipe them
 * by suffix without touching seed/dev data.
 *
 * CastFlow's only money flow is the caster platform subscription, so the
 * caster factory provisions an ACTIVE `CasterSubscription` by default — any
 * test that posts a job or accepts a bid would otherwise 402 on the
 * subscription gate. Pass `{ subscribed: false }` to opt out and exercise the
 * gate.
 */
import { randomUUID } from 'node:crypto'
import type { SubscriptionStatus } from '@prisma/client'
import { prisma } from '../../src/lib/prisma'

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

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Provision (or refresh) an ACTIVE CasterSubscription for a caster profile and
 * mirror the Stripe customer id onto the CasterProfile. Idempotent per caster
 * (unique on casterId).
 */
export async function createActiveSubscription(casterId: string) {
  const stripeCustomerId = `cus_test_${randomUUID()}`
  const stripeSubscriptionId = `sub_test_${randomUUID()}`
  const currentPeriodEnd = new Date(Date.now() + THIRTY_DAYS_MS)
  await prisma.casterProfile.update({
    where: { id: casterId },
    data: { stripeCustomerId },
  })
  return prisma.casterSubscription.upsert({
    where: { casterId },
    create: {
      casterId,
      stripeCustomerId,
      stripeSubscriptionId,
      status: 'active',
      priceId: 'price_test',
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
    },
    update: {
      stripeCustomerId,
      stripeSubscriptionId,
      status: 'active',
      priceId: 'price_test',
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
    },
  })
}

/**
 * Force a caster's subscription into a given status, leaving the period end in
 * the future. Useful for exercising the lazy gate's status branch.
 */
export async function setSubscriptionStatus(casterId: string, status: SubscriptionStatus) {
  return prisma.casterSubscription.update({
    where: { casterId },
    data: { status },
  })
}

interface CasterOpts extends UserOpts {
  companyName?: string
  companyType?: 'brand' | 'agency' | 'production_house' | 'independent'
  /** Provision an active subscription so job-post / bid-accept gates pass. Default true. */
  subscribed?: boolean
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
  if (opts.subscribed !== false) {
    await createActiveSubscription(caster.id)
  }
  return { user, caster }
}

interface ArtistOpts extends UserOpts {
  firstName?: string
  lastName?: string
  artistType?: 'model' | 'actor'
  approvalStatus?: 'pending' | 'approved' | 'rejected'
}

export async function createTestArtist(opts: ArtistOpts = {}) {
  const user = await createUserRow('artist', opts)
  const artist = await prisma.artistProfile.create({
    data: {
      userId: user.id,
      firstName: opts.firstName ?? 'Test',
      lastName: opts.lastName ?? 'Artist',
      artistType: opts.artistType ?? 'model',
      approvalStatus: opts.approvalStatus ?? 'approved',
    },
  })
  await prisma.user.update({
    where: { id: user.id },
    data: {
      profileId: artist.id,
      approvalStatus: opts.approvalStatus ?? 'approved',
    },
  })
  return { user, artist }
}

// ──────────────────────────────────────────────────────────────────────────
// Job / Bid / Booking / Contract
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
    | 'pending_contract'
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
      paymentTerms: 'Fee settled directly between caster and artist.',
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
  bookingStatus?: BookingOpts['status']
  totalAmount?: number
  shootDate?: Date
  contractStatus?: ContractOpts['status']
  /** Provision the caster's active subscription. Default true. */
  subscribed?: boolean
}

/**
 * Create a fully populated booking scenario in one call:
 * caster (+ active subscription) + artist + job + bid + booking + contract.
 *
 * Use as the default starting point for booking-flow tests — override only
 * the fields a given test cares about.
 */
export async function createBookingScenario(opts: ScenarioOpts = {}) {
  const { caster, user: casterUser } = await createTestCaster({
    ...(opts.subscribed === false ? { subscribed: false } : {}),
  })
  const { artist, user: artistUser } = await createTestArtist()
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
  const contract = opts.contractStatus
    ? await createTestContract({ bookingId: booking.id, status: opts.contractStatus })
    : null
  return { casterUser, caster, artistUser, artist, job, bid, booking, contract }
}
