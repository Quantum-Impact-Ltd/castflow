import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { JobInviteService } from '../../src/services/JobInviteService'
import { BidService } from '../../src/services/BidService'
import { prisma } from '../../src/lib/prisma'
import { AppError } from '../../src/errors'
import { createTestArtist, createTestCaster, createTestJob } from '../helpers/factories'
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

describe('JobInviteService.invite', () => {
  it(
    'creates a pending invite for an approved artist on an active job',
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id, visibility: 'invite_only' })

      const invite = await JobInviteService.invite(casterUser.id, job.id, {
        artistId: artist.id,
        message: 'Would love to have you',
      })
      expect(invite.status).toBe('pending')
      expect(invite.jobId).toBe(job.id)
      expect(invite.artistId).toBe(artist.id)
    },
    TEST_TIMEOUT
  )

  it(
    "non-owner caster cannot invite on another caster's job (NOT_FOUND for opaque rejection)",
    async () => {
      const { caster } = await createTestCaster()
      const { user: otherCasterUser } = await createTestCaster()
      const { artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })

      let caught: unknown
      try {
        await JobInviteService.invite(otherCasterUser.id, job.id, { artistId: artist.id })
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('NOT_FOUND')
    },
    TEST_TIMEOUT
  )

  it(
    'rejects inviting an unapproved artist with INVALID_STATE',
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { artist } = await createTestArtist({ approvalStatus: 'pending' })
      const job = await createTestJob({ casterId: caster.id })

      let caught: unknown
      try {
        await JobInviteService.invite(casterUser.id, job.id, { artistId: artist.id })
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('INVALID_STATE')
    },
    TEST_TIMEOUT
  )

  it(
    'rejects a second invite to the same artist+job with INVALID_STATE',
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })
      await JobInviteService.invite(casterUser.id, job.id, { artistId: artist.id })

      let caught: unknown
      try {
        await JobInviteService.invite(casterUser.id, job.id, { artistId: artist.id })
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('INVALID_STATE')
    },
    TEST_TIMEOUT
  )

  it(
    'rejects invites to a closed job with JOB_CLOSED',
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id, status: 'filled' })

      let caught: unknown
      try {
        await JobInviteService.invite(casterUser.id, job.id, { artistId: artist.id })
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('JOB_CLOSED')
    },
    TEST_TIMEOUT
  )
})

describe('JobInviteService.accept / decline', () => {
  it(
    'artist accepts a pending invite → status accepted',
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { user: artistUser, artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })
      const invite = await JobInviteService.invite(casterUser.id, job.id, {
        artistId: artist.id,
      })

      const accepted = await JobInviteService.accept(artistUser.id, invite.id)
      expect(accepted.status).toBe('accepted')
    },
    TEST_TIMEOUT
  )

  it(
    'artist declines a pending invite → status declined',
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { user: artistUser, artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })
      const invite = await JobInviteService.invite(casterUser.id, job.id, {
        artistId: artist.id,
      })

      const declined = await JobInviteService.decline(artistUser.id, invite.id)
      expect(declined.status).toBe('declined')
    },
    TEST_TIMEOUT
  )

  it(
    "artist cannot accept another artist's invite (FORBIDDEN)",
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { artist: artistA } = await createTestArtist()
      const { user: artistBUser } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })
      const invite = await JobInviteService.invite(casterUser.id, job.id, {
        artistId: artistA.id,
      })

      let caught: unknown
      try {
        await JobInviteService.accept(artistBUser.id, invite.id)
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('FORBIDDEN')
    },
    TEST_TIMEOUT
  )

  it(
    'cannot transition an already-accepted invite (INVALID_STATE)',
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { user: artistUser, artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })
      const invite = await JobInviteService.invite(casterUser.id, job.id, {
        artistId: artist.id,
      })
      await JobInviteService.accept(artistUser.id, invite.id)

      let caught: unknown
      try {
        await JobInviteService.accept(artistUser.id, invite.id)
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('INVALID_STATE')
    },
    TEST_TIMEOUT
  )
})

describe('Invite-only bid gating', () => {
  it(
    'artist with an accepted invite CAN bid on an invite_only job',
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { user: artistUser, artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id, visibility: 'invite_only' })
      const invite = await JobInviteService.invite(casterUser.id, job.id, {
        artistId: artist.id,
      })
      await JobInviteService.accept(artistUser.id, invite.id)

      const bid = await BidService.submitBid(artistUser.id, job.id, {
        proposedRate: 500,
        coverNote: 'invited',
        highlightedPortfolioItems: [],
      })
      expect(bid.status).toBe('pending')
    },
    TEST_TIMEOUT
  )

  it(
    'artist with a DECLINED invite cannot bid on an invite_only job (FORBIDDEN)',
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { user: artistUser, artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id, visibility: 'invite_only' })
      const invite = await JobInviteService.invite(casterUser.id, job.id, {
        artistId: artist.id,
      })
      await JobInviteService.decline(artistUser.id, invite.id)

      let caught: unknown
      try {
        await BidService.submitBid(artistUser.id, job.id, {
          proposedRate: 500,
          coverNote: 'declined invite, still trying',
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
    'artist with a PENDING invite cannot bid on an invite_only job (FORBIDDEN)',
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { user: artistUser, artist } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id, visibility: 'invite_only' })
      await JobInviteService.invite(casterUser.id, job.id, { artistId: artist.id })

      let caught: unknown
      try {
        await BidService.submitBid(artistUser.id, job.id, {
          proposedRate: 500,
          coverNote: 'pending invite',
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

describe('JobInviteService.getForArtist', () => {
  it(
    'returns the invite + job detail with sensitive location fields hidden',
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { user: artistUser, artist } = await createTestArtist()
      const job = await createTestJob({
        casterId: caster.id,
        shootLocationDetail: 'SECRET STUDIO',
        callTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      const invite = await JobInviteService.invite(casterUser.id, job.id, {
        artistId: artist.id,
      })

      const result = await JobInviteService.getForArtist(artistUser.id, invite.id)
      expect(result.id).toBe(invite.id)
      expect(result.job.shootLocationDetail).toBeNull()
      expect(result.job.callTime).toBeNull()
    },
    TEST_TIMEOUT
  )

  it(
    "other artists cannot read an invite addressed to a different artist (NOT_FOUND for opacity)",
    async () => {
      const { user: casterUser, caster } = await createTestCaster()
      const { artist: artistA } = await createTestArtist()
      const { user: artistBUser } = await createTestArtist()
      const job = await createTestJob({ casterId: caster.id })
      const invite = await prisma.jobInvite.create({
        data: { jobId: job.id, artistId: artistA.id, status: 'pending' },
      })

      let caught: unknown
      try {
        await JobInviteService.getForArtist(artistBUser.id, invite.id)
      } catch (err) {
        caught = err
      }
      expect((caught as AppError).code).toBe('NOT_FOUND')
    },
    TEST_TIMEOUT
  )
})
