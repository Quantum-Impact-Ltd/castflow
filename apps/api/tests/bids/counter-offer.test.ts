import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { BidService } from '../../src/services/BidService'
import { prisma } from '../../src/lib/prisma'
import { AppError } from '../../src/errors'
import {
  createTestArtist,
  createTestBid,
  createTestCaster,
  createTestJob,
} from '../helpers/factories'
import { cleanupTestData } from '../helpers/cleanup'
import { resetStripeMockCalls, resetStripeMockState } from '../helpers/stripe-mock'

const TEST_TIMEOUT = 30_000

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

describe('BidService.proposeCounterOffer', () => {
  it(
    'creates a pending counter-offer on a shortlisted bid',
    async () => {
      const { caster } = await createTestCaster()
      const { user: artistUser, artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })
      const bid = await createTestBid({
        jobId: job.id,
        artistId: artist.id,
        status: 'shortlisted',
      })

      const offer = await BidService.proposeCounterOffer(artistUser.id, bid.id, {
        proposedRate: 650,
        message: 'My usual rate for this scope',
      })
      expect(offer.status).toBe('pending')
      expect(Number(offer.proposedRate)).toBe(650)
      expect(offer.bidId).toBe(bid.id)
    },
    TEST_TIMEOUT
  )

  it(
    'rejects counter-offers on non-shortlisted bids with BID_NOT_PENDING',
    async () => {
      const { caster } = await createTestCaster()
      const { user: artistUser, artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })
      const bid = await createTestBid({ jobId: job.id, artistId: artist.id }) // pending

      let caught: unknown
      try {
        await BidService.proposeCounterOffer(artistUser.id, bid.id, { proposedRate: 700 })
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('BID_NOT_PENDING')
    },
    TEST_TIMEOUT
  )

  it(
    'allows only one pending counter-offer per bid (returns INVALID_STATE on the second)',
    async () => {
      const { caster } = await createTestCaster()
      const { user: artistUser, artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })
      const bid = await createTestBid({
        jobId: job.id,
        artistId: artist.id,
        status: 'shortlisted',
      })

      await BidService.proposeCounterOffer(artistUser.id, bid.id, { proposedRate: 650 })

      let caught: unknown
      try {
        await BidService.proposeCounterOffer(artistUser.id, bid.id, { proposedRate: 700 })
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('INVALID_STATE')
    },
    TEST_TIMEOUT
  )

  it(
    'requires estimatedHours on hourly jobs',
    async () => {
      const { caster } = await createTestCaster()
      const { user: artistUser, artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id, paymentType: 'hourly' })
      const bid = await prisma.bid.create({
        data: {
          jobId: job.id,
          artistId: artist.id,
          proposedRate: 80,
          estimatedHours: 8,
          coverNote: 'original',
          highlightedPortfolioItems: [],
          status: 'shortlisted',
        },
      })

      let caught: unknown
      try {
        await BidService.proposeCounterOffer(artistUser.id, bid.id, { proposedRate: 90 })
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('HOURS_REQUIRED_FOR_HOURLY')
    },
    TEST_TIMEOUT
  )
})

describe('BidService.acceptCounterOffer', () => {
  it(
    "overwrites the bid's proposedRate and estimatedHours when accepted",
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { user: artistUser, artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id, paymentType: 'hourly' })
      const bid = await prisma.bid.create({
        data: {
          jobId: job.id,
          artistId: artist.id,
          proposedRate: 80,
          estimatedHours: 6,
          coverNote: 'original',
          highlightedPortfolioItems: [],
          status: 'shortlisted',
        },
      })
      const offer = await BidService.proposeCounterOffer(artistUser.id, bid.id, {
        proposedRate: 100,
        estimatedHours: 8,
      })

      const accepted = await BidService.acceptCounterOffer(casterUser.id, offer.id)
      expect(accepted.status).toBe('accepted')

      const freshBid = await prisma.bid.findUnique({ where: { id: bid.id } })
      expect(Number(freshBid?.proposedRate)).toBe(100)
      expect(Number(freshBid?.estimatedHours ?? 0)).toBe(8)
      // Bid status should NOT change — still shortlisted, ready to be accepted.
      expect(freshBid?.status).toBe('shortlisted')
    },
    TEST_TIMEOUT
  )

  it(
    "decline leaves the bid's proposedRate untouched and marks the offer declined",
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { user: artistUser, artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })
      const bid = await createTestBid({
        jobId: job.id,
        artistId: artist.id,
        status: 'shortlisted',
      })
      const offer = await BidService.proposeCounterOffer(artistUser.id, bid.id, {
        proposedRate: 999,
      })

      const declined = await BidService.declineCounterOffer(casterUser.id, offer.id)
      expect(declined.status).toBe('declined')

      const freshBid = await prisma.bid.findUnique({ where: { id: bid.id } })
      expect(Number(freshBid?.proposedRate)).toBe(500) // unchanged from factory default
    },
    TEST_TIMEOUT
  )

  it(
    'cannot respond to an already-resolved counter-offer (INVALID_STATE)',
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { user: artistUser, artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })
      const bid = await createTestBid({
        jobId: job.id,
        artistId: artist.id,
        status: 'shortlisted',
      })
      const offer = await BidService.proposeCounterOffer(artistUser.id, bid.id, {
        proposedRate: 700,
      })
      await BidService.declineCounterOffer(casterUser.id, offer.id)

      let caught: unknown
      try {
        await BidService.acceptCounterOffer(casterUser.id, offer.id)
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('INVALID_STATE')
    },
    TEST_TIMEOUT
  )

  it(
    "non-owner caster cannot respond to another caster's counter-offer (FORBIDDEN)",
    async () => {
      const { caster } = await createTestCaster()
      const { user: otherCasterUser } = await createTestCaster()
      const { user: artistUser, artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })
      const bid = await createTestBid({
        jobId: job.id,
        artistId: artist.id,
        status: 'shortlisted',
      })
      const offer = await BidService.proposeCounterOffer(artistUser.id, bid.id, {
        proposedRate: 700,
      })

      let caught: unknown
      try {
        await BidService.acceptCounterOffer(otherCasterUser.id, offer.id)
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('FORBIDDEN')
    },
    TEST_TIMEOUT
  )
})
