import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { NotificationService } from '../../src/services/NotificationService'
import { EmailService } from '../../src/services/EmailService'
import { prisma } from '../../src/lib/prisma'
import { createTestAdmin, createTestArtist } from '../helpers/factories'
import { cleanupTestData } from '../helpers/cleanup'

const TEST_TIMEOUT = 30_000

beforeAll(async () => {
  await cleanupTestData()
}, 60_000)
beforeEach(() => {
  EmailService.__clearTestInbox()
})
afterAll(async () => {
  await cleanupTestData()
}, 60_000)

describe('NotificationService.notifyEvent', () => {
  it(
    'writes a Notification row AND a test-inbox email for the target user',
    async () => {
      const { user } = await createTestArtist()
      await NotificationService.notifyEvent({
        userId: user.id,
        type: 'bid_received',
        title: 'New bid received',
        body: 'Body of the notification',
        relatedEntityType: 'bid',
        relatedEntityId: 'bid_test_1',
        email: { ctaUrl: 'https://app/bids' },
      })

      const notif = await prisma.notification.findFirst({
        where: { userId: user.id, type: 'bid_received' },
      })
      expect(notif).not.toBeNull()
      expect(notif?.title).toBe('New bid received')
      expect(notif?.relatedEntityType).toBe('bid')
      expect(notif?.relatedEntityId).toBe('bid_test_1')

      const lastEmail = EmailService.__lastEmail(user.email)
      expect(lastEmail).toBeDefined()
      expect(lastEmail?.subject).toBe('New bid received')
      expect(lastEmail?.html).toContain('Body of the notification')
      expect(lastEmail?.html).toContain('https://app/bids')
    },
    TEST_TIMEOUT
  )

  it(
    'with email:false skips the email send but still writes the in-app row',
    async () => {
      const { user } = await createTestArtist()
      await NotificationService.notifyEvent({
        userId: user.id,
        type: 'bid_received',
        title: 'In-app only',
        body: 'no email',
        email: false,
      })

      const notif = await prisma.notification.findFirst({
        where: { userId: user.id, title: 'In-app only' },
      })
      expect(notif).not.toBeNull()
      expect(EmailService.__lastEmail(user.email)).toBeUndefined()
    },
    TEST_TIMEOUT
  )

  it(
    'swallows errors from a missing-user lookup without throwing (fire-and-forget contract)',
    async () => {
      // No throw expected even though userId is bogus.
      await NotificationService.notifyEvent({
        userId: 'does-not-exist',
        type: 'bid_received',
        title: 'Phantom user',
        body: 'should still not blow up',
      })
      // No assertion needed beyond the call not throwing — the DB write fails
      // silently (logged) and we move on.
    },
    TEST_TIMEOUT
  )
})

describe('NotificationService.notifyAdmins', () => {
  it(
    'fans out to every active admin user',
    async () => {
      const admin1 = await createTestAdmin()
      const admin2 = await createTestAdmin()
      // Suspended admin should be skipped.
      const suspended = await createTestAdmin({ status: 'suspended' })

      // Use a unique relatedEntityId so the in-process dedup doesn't suppress.
      const entityId = `entity-${Date.now()}-${Math.random()}`
      await NotificationService.notifyAdmins({
        type: 'artist_rejected',
        title: 'Test admin alert',
        body: 'admin attention required',
        relatedEntityType: 'artist_profile',
        relatedEntityId: entityId,
      })

      // Poll for both admins' rows (notifyEvent awaits per-admin so this should
      // be ready by the time notifyAdmins resolves, but DB latency may lag).
      let rows: Array<{ userId: string }> = []
      for (let i = 0; i < 20; i++) {
        rows = await prisma.notification.findMany({
          where: { title: 'Test admin alert', relatedEntityId: entityId },
          select: { userId: true },
        })
        if (rows.length >= 2) break
        await new Promise((r) => setTimeout(r, 100))
      }
      const userIds = rows.map((r) => r.userId)
      expect(userIds).toContain(admin1.id)
      expect(userIds).toContain(admin2.id)
      expect(userIds).not.toContain(suspended.id)
    },
    TEST_TIMEOUT
  )

  it(
    'dedups identical (type, relatedEntityId) firings within the 1h window',
    async () => {
      const admin = await createTestAdmin()
      const entityId = `dedup-entity-${Date.now()}`

      await NotificationService.notifyAdmins({
        type: 'dispute_resolved',
        title: 'Dedup alert',
        body: 'first fire',
        relatedEntityType: 'dispute',
        relatedEntityId: entityId,
      })
      // Wait for the first fire to land.
      for (let i = 0; i < 20; i++) {
        const found = await prisma.notification.findFirst({
          where: { userId: admin.id, relatedEntityId: entityId },
          select: { id: true },
        })
        if (found) break
        await new Promise((r) => setTimeout(r, 100))
      }

      // Second fire — same key, should be suppressed.
      await NotificationService.notifyAdmins({
        type: 'dispute_resolved',
        title: 'Dedup alert',
        body: 'second fire (should be suppressed)',
        relatedEntityType: 'dispute',
        relatedEntityId: entityId,
      })
      // Allow a beat for any rogue async writes to land.
      await new Promise((r) => setTimeout(r, 250))

      const count = await prisma.notification.count({
        where: { userId: admin.id, relatedEntityId: entityId, title: 'Dedup alert' },
      })
      expect(count).toBe(1)
    },
    TEST_TIMEOUT
  )

  it(
    'different relatedEntityId values bypass dedup and both fire',
    async () => {
      const admin = await createTestAdmin()
      const idA = `entity-a-${Date.now()}`
      const idB = `entity-b-${Date.now()}`

      await NotificationService.notifyAdmins({
        type: 'dispute_resolved',
        title: 'Bypass dedup',
        body: 'a',
        relatedEntityType: 'dispute',
        relatedEntityId: idA,
      })
      await NotificationService.notifyAdmins({
        type: 'dispute_resolved',
        title: 'Bypass dedup',
        body: 'b',
        relatedEntityType: 'dispute',
        relatedEntityId: idB,
      })

      let rows: Array<{ relatedEntityId: string | null }> = []
      for (let i = 0; i < 20; i++) {
        rows = await prisma.notification.findMany({
          where: { userId: admin.id, title: 'Bypass dedup' },
          select: { relatedEntityId: true },
        })
        if (rows.length >= 2) break
        await new Promise((r) => setTimeout(r, 100))
      }
      const ids = rows.map((r) => r.relatedEntityId).filter(Boolean) as string[]
      expect(ids).toContain(idA)
      expect(ids).toContain(idB)
    },
    TEST_TIMEOUT
  )
})

describe('NotificationService listing + read state', () => {
  it(
    'listForUser returns rows ordered by createdAt desc; markRead sets readAt; markAllRead clears every unread',
    async () => {
      const { user } = await createTestArtist()
      // Three notifications. Stagger by ~5ms so `createdAt` values differ
      // — Postgres's NOW() resolution + the local container's sub-ms write
      // latency would otherwise collapse identical timestamps and make the
      // desc-order assertion non-deterministic.
      for (let i = 0; i < 3; i++) {
        await NotificationService.create({
          userId: user.id,
          type: 'bid_received',
          title: `Item ${i}`,
          body: `body ${i}`,
        })
        await new Promise((r) => setTimeout(r, 5))
      }

      const initial = await NotificationService.listForUser(user.id)
      expect(initial.length).toBe(3)
      // Ordering: newest first.
      expect(initial[0]?.title).toBe('Item 2')
      expect(initial[2]?.title).toBe('Item 0')

      // Mark the middle one read.
      await NotificationService.markRead(user.id, [initial[1]!.id])
      const oneRead = await NotificationService.listForUser(user.id, { unreadOnly: true })
      expect(oneRead.length).toBe(2)
      expect(oneRead.find((n) => n.title === 'Item 1')).toBeUndefined()

      // Mark all read clears the rest.
      await NotificationService.markAllRead(user.id)
      const noneUnread = await NotificationService.listForUser(user.id, { unreadOnly: true })
      expect(noneUnread.length).toBe(0)
    },
    TEST_TIMEOUT
  )
})
