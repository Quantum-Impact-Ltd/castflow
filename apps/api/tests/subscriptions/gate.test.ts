import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { BidService } from '../../src/services/BidService'
import { SubscriptionService } from '../../src/services/SubscriptionService'
import { AppError } from '../../src/errors'
import {
  createTestArtist,
  createTestBid,
  createTestCaster,
  createTestJob,
  setSubscriptionStatus,
} from '../helpers/factories'
import { cleanupTestData } from '../helpers/cleanup'

const TEST_TIMEOUT = 60_000

beforeAll(async () => {
  await cleanupTestData()
}, 60_000)
afterAll(async () => {
  await cleanupTestData()
}, 60_000)

describe('Subscription gate', () => {
  it(
    'hasActiveSubscription reflects subscription state',
    async () => {
      const { caster } = await createTestCaster() // subscribed by default
      expect(await SubscriptionService.hasActiveSubscription(caster.id)).toBe(true)

      const { caster: unsub } = await createTestCaster({ subscribed: false })
      expect(await SubscriptionService.hasActiveSubscription(unsub.id)).toBe(false)

      // A past_due subscription does not count as active.
      await setSubscriptionStatus(caster.id, 'past_due')
      expect(await SubscriptionService.hasActiveSubscription(caster.id)).toBe(false)
    },
    TEST_TIMEOUT
  )

  it(
    'blocks acceptBid with SUBSCRIPTION_REQUIRED when the caster is not subscribed',
    async () => {
      const { user, caster } = await createTestCaster({ subscribed: false })
      const job = await createTestJob({ casterId: caster.id })
      const { artist } = await createTestArtist()
      const bid = await createTestBid({ jobId: job.id, artistId: artist.id })

      let caught: unknown
      try {
        await BidService.acceptBid(user.id, bid.id, '21 Test Street, EC1 2AB')
      } catch (err) {
        caught = err
      }
      expect(caught).toBeInstanceOf(AppError)
      expect((caught as AppError).code).toBe('SUBSCRIPTION_REQUIRED')
      expect((caught as AppError).statusCode).toBe(402)
    },
    TEST_TIMEOUT
  )

  it(
    'allows acceptBid and creates a pending_contract booking when subscribed',
    async () => {
      const { user, caster } = await createTestCaster() // active subscription
      const job = await createTestJob({ casterId: caster.id })
      const { artist } = await createTestArtist()
      const bid = await createTestBid({ jobId: job.id, artistId: artist.id })

      const booking = await BidService.acceptBid(user.id, bid.id, '21 Test Street, EC1 2AB')
      expect(booking.status).toBe('pending_contract')
    },
    TEST_TIMEOUT
  )
})
