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
}, 60_000)
beforeEach(() => {
  resetStripeMockCalls()
  resetStripeMockState()
})
afterAll(async () => {
  await cleanupTestData()
}, 60_000)

describe('BidService.submitBid', () => {
  it(
    'creates a pending bid for an approved artist on an active public job',
    async () => {
      const { caster } = await createTestCaster()
      const { user: artistUser, artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })

      const bid = await BidService.submitBid(artistUser.id, job.id, {
        proposedRate: 450,
        coverNote: 'Excited to bid on this',
        highlightedPortfolioItems: [],
      })
      expect(bid.status).toBe('pending')
      expect(Number(bid.proposedRate)).toBe(450)
      expect(bid.artistId).toBe(artist.id)
    },
    TEST_TIMEOUT
  )

  it(
    'rejects a duplicate bid from the same artist on the same job (DUPLICATE_BID)',
    async () => {
      const { caster } = await createTestCaster()
      const { user: artistUser, artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })
      await createTestBid({ jobId: job.id, artistId: artist.id })

      let caught: unknown
      try {
        await BidService.submitBid(artistUser.id, job.id, {
          proposedRate: 500,
          coverNote: 'second attempt',
          highlightedPortfolioItems: [],
        })
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('DUPLICATE_BID')
    },
    TEST_TIMEOUT
  )

  it(
    'rejects bids on invite-only jobs without an accepted invite (FORBIDDEN)',
    async () => {
      const { caster } = await createTestCaster()
      const { user: artistUser } = await createTestArtist()
      const job = await createTestJob({
        casterId: caster.id,
        visibility: 'invite_only',
      })

      let caught: unknown
      try {
        await BidService.submitBid(artistUser.id, job.id, {
          proposedRate: 500,
          coverNote: 'sneaky',
          highlightedPortfolioItems: [],
        })
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('FORBIDDEN')
    },
    TEST_TIMEOUT
  )

  it(
    'rejects bids on a closed job with JOB_CLOSED',
    async () => {
      const { caster } = await createTestCaster()
      const { user: artistUser } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id, status: 'filled' })

      let caught: unknown
      try {
        await BidService.submitBid(artistUser.id, job.id, {
          proposedRate: 500,
          coverNote: 'too late',
          highlightedPortfolioItems: [],
        })
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('JOB_CLOSED')
    },
    TEST_TIMEOUT
  )

  it(
    'requires estimatedHours on hourly jobs (HOURS_REQUIRED_FOR_HOURLY)',
    async () => {
      const { caster } = await createTestCaster()
      const { user: artistUser } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id, paymentType: 'hourly' })

      let caught: unknown
      try {
        await BidService.submitBid(artistUser.id, job.id, {
          proposedRate: 80,
          coverNote: 'hourly bid',
          highlightedPortfolioItems: [],
        })
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('HOURS_REQUIRED_FOR_HOURLY')
    },
    TEST_TIMEOUT
  )

  it(
    'unapproved artist cannot bid (FORBIDDEN)',
    async () => {
      const { caster } = await createTestCaster()
      const { user: artistUser } = await createTestArtist({ approvalStatus: 'pending' })
      const job = await createTestJob({ casterId: caster.id })

      let caught: unknown
      try {
        await BidService.submitBid(artistUser.id, job.id, {
          proposedRate: 500,
          coverNote: 'before approval',
          highlightedPortfolioItems: [],
        })
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('FORBIDDEN')
    },
    TEST_TIMEOUT
  )
})

describe('BidService.updateBid', () => {
  it(
    'allows the artist to edit their own pending bid (rate + coverNote)',
    async () => {
      const { caster } = await createTestCaster()
      const { user: artistUser, artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })
      const bid = await createTestBid({ jobId: job.id, artistId: artist.id })

      const updated = await BidService.updateBid(artistUser.id, bid.id, {
        proposedRate: 600,
        coverNote: 'revised note',
        highlightedPortfolioItems: [],
      })
      expect(Number(updated.proposedRate)).toBe(600)
      expect(updated.coverNote).toBe('revised note')
    },
    TEST_TIMEOUT
  )

  it(
    'rejects edits to a non-pending bid with BID_LOCKED',
    async () => {
      const { caster } = await createTestCaster()
      const { user: artistUser, artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })
      const bid = await createTestBid({
        jobId: job.id,
        artistId: artist.id,
        status: 'shortlisted',
      })

      let caught: unknown
      try {
        await BidService.updateBid(artistUser.id, bid.id, {
          proposedRate: 999,
          coverNote: 'sneaky',
          highlightedPortfolioItems: [],
        })
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('BID_LOCKED')
    },
    TEST_TIMEOUT
  )

  it(
    "rejects edits to another artist's bid with FORBIDDEN",
    async () => {
      const { caster } = await createTestCaster()
      const { artist: artistA } = await createTestArtist()
      const { user: artistBUser } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })
      const bid = await createTestBid({ jobId: job.id, artistId: artistA.id })

      let caught: unknown
      try {
        await BidService.updateBid(artistBUser.id, bid.id, {
          proposedRate: 100,
          coverNote: 'not mine',
          highlightedPortfolioItems: [],
        })
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('FORBIDDEN')
    },
    TEST_TIMEOUT
  )
})

describe('BidService.withdrawBid', () => {
  it(
    'sets a pending bid to withdrawn',
    async () => {
      const { caster } = await createTestCaster()
      const { user: artistUser, artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })
      const bid = await createTestBid({ jobId: job.id, artistId: artist.id })

      const updated = await BidService.withdrawBid(artistUser.id, bid.id)
      expect(updated.status).toBe('withdrawn')
    },
    TEST_TIMEOUT
  )

  it(
    'rejects withdraw on an accepted bid (BID_LOCKED)',
    async () => {
      const { caster } = await createTestCaster()
      const { user: artistUser, artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })
      const bid = await createTestBid({
        jobId: job.id,
        artistId: artist.id,
        status: 'accepted',
      })

      let caught: unknown
      try {
        await BidService.withdrawBid(artistUser.id, bid.id)
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('BID_LOCKED')
    },
    TEST_TIMEOUT
  )
})

describe('BidService.shortlistBid / rejectBid / undoReject', () => {
  it(
    'shortlist flips a pending bid to shortlisted and unlocks the messaging thread',
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })
      const bid = await createTestBid({ jobId: job.id, artistId: artist.id })

      await BidService.shortlistBid(casterUser.id, bid.id)

      const fresh = await prisma.bid.findUnique({ where: { id: bid.id } })
      expect(fresh?.status).toBe('shortlisted')

      const thread = await prisma.messageThread.findUnique({
        where: {
          jobId_casterId_artistId: { jobId: job.id, casterId: caster.id, artistId: artist.id },
        },
      })
      expect(thread?.unlocked).toBe(true)
    },
    TEST_TIMEOUT
  )

  it(
    'reject sets the bid to rejected with the supplied reason',
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })
      const bid = await createTestBid({ jobId: job.id, artistId: artist.id })

      await BidService.rejectBid(casterUser.id, bid.id, 'not the right look')

      const fresh = await prisma.bid.findUnique({ where: { id: bid.id } })
      expect(fresh?.status).toBe('rejected')
      expect(fresh?.rejectionReason).toBe('not the right look')
    },
    TEST_TIMEOUT
  )

  it(
    'undoReject within 24h restores rejected → pending',
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })
      const bid = await createTestBid({
        jobId: job.id,
        artistId: artist.id,
        status: 'rejected',
      })

      const restored = await BidService.undoReject(casterUser.id, bid.id)
      expect(restored.status).toBe('pending')
      expect(restored.rejectionReason).toBeNull()
    },
    TEST_TIMEOUT
  )

  it(
    'undoReject beyond 24h is rejected with INVALID_STATE',
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })
      const bid = await createTestBid({
        jobId: job.id,
        artistId: artist.id,
        status: 'rejected',
      })
      // Backdate the bid's updatedAt to 25h ago — beyond the 24h undo window.
      await prisma.$executeRawUnsafe(
        `UPDATE bids SET updated_at = NOW() - INTERVAL '25 hours' WHERE id = $1`,
        bid.id
      )

      let caught: unknown
      try {
        await BidService.undoReject(casterUser.id, bid.id)
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('INVALID_STATE')
    },
    TEST_TIMEOUT
  )
})

describe('BidService.acceptBid', () => {
  it(
    'creates a booking, marks bid accepted, leaves other pending bids alone when headcount > 1',
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { artist: artistA } = await createTestArtist()
      const { artist: artistB } = await createTestArtist()
      // Job with headcount=2 — accepting one bid does NOT close the others.
      const job = await prisma.job.update({
        where: { id: (await createTestJob({ casterId: caster.id })).id },
        data: { headcountRequired: 2 },
      })
      const bidA = await createTestBid({
        jobId: job.id,
        artistId: artistA.id,
        status: 'shortlisted',
      })
      const bidB = await createTestBid({ jobId: job.id, artistId: artistB.id })

      const booking = await BidService.acceptBid(
        casterUser.id,
        bidA.id,
        '21 Test Street, EC1 2AB'
      )
      expect(booking.status).toBe('pending_contract')
      expect(booking.casterId).toBe(caster.id)
      expect(booking.artistId).toBe(artistA.id)
      expect(Number(booking.agreedRate)).toBe(500)

      const freshBidA = await prisma.bid.findUnique({ where: { id: bidA.id } })
      const freshBidB = await prisma.bid.findUnique({ where: { id: bidB.id } })
      expect(freshBidA?.status).toBe('accepted')
      expect(freshBidB?.status).toBe('pending')

      const freshJob = await prisma.job.findUnique({ where: { id: job.id } })
      expect(freshJob?.headcountFilled).toBe(1)
      expect(freshJob?.status).toBe('active')
    },
    TEST_TIMEOUT
  )

  it(
    'accepting the headcount-completing bid expires sibling pending/shortlisted bids and flips job → filled',
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { artist: artistA } = await createTestArtist()
      const { artist: artistB } = await createTestArtist()
      const { artist: artistC } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id }) // headcount 1
      const bidA = await createTestBid({ jobId: job.id, artistId: artistA.id })
      const bidB = await createTestBid({
        jobId: job.id,
        artistId: artistB.id,
        status: 'shortlisted',
      })
      const bidC = await createTestBid({ jobId: job.id, artistId: artistC.id })

      await BidService.acceptBid(casterUser.id, bidA.id, '21 Test Street, EC1 2AB')

      const fresh = await prisma.bid.findMany({
        where: { jobId: job.id },
        select: { id: true, status: true },
      })
      const byId = Object.fromEntries(fresh.map((b) => [b.id, b.status]))
      expect(byId[bidA.id]).toBe('accepted')
      expect(byId[bidB.id]).toBe('expired')
      expect(byId[bidC.id]).toBe('expired')

      const freshJob = await prisma.job.findUnique({ where: { id: job.id } })
      expect(freshJob?.status).toBe('filled')
      expect(freshJob?.headcountFilled).toBe(1)
    },
    TEST_TIMEOUT
  )

  it(
    'rejects accepting a withdrawn bid with BID_NOT_PENDING',
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })
      const bid = await createTestBid({
        jobId: job.id,
        artistId: artist.id,
        status: 'withdrawn',
      })

      let caught: unknown
      try {
        await BidService.acceptBid(casterUser.id, bid.id, 'somewhere')
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('BID_NOT_PENDING')
    },
    TEST_TIMEOUT
  )

  it(
    'computes totalAmount as agreedRate × agreedHours for hourly jobs',
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { artist } = await createTestArtist()
      const job = await createTestJob({
        casterId: caster.id,
        paymentType: 'hourly',
        rateAmount: 80,
      })
      const bid = await prisma.bid.create({
        data: {
          jobId: job.id,
          artistId: artist.id,
          proposedRate: 85,
          estimatedHours: 8,
          coverNote: 'hourly bid',
          highlightedPortfolioItems: [],
          status: 'shortlisted',
        },
      })

      const booking = await BidService.acceptBid(
        casterUser.id,
        bid.id,
        '21 Test Street, EC1 2AB'
      )
      expect(Number(booking.totalAmount)).toBe(680) // 85 × 8
      expect(Number(booking.agreedHours)).toBe(8)
      expect(booking.paymentType).toBe('hourly')
    },
    TEST_TIMEOUT
  )
})
