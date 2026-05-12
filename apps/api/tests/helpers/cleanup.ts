/**
 * Idempotent test cleanup. Codifies the `@castflow.test` email convention
 * used by the auth/register-* tests.
 *
 * Approach: resolve all test-domain user ids and profile ids up front, then
 * delete by id everywhere. Relation-chained where-clauses (`caster: { user:
 * { email: ... } }`) were observed to leave stray rows when used on bulk
 * deleteMany — flat id filters avoid the issue.
 *
 * Order (most-dependent → least):
 *   Messages → MessageThreads → Reviews/Disputes/Payments/Contracts →
 *   Bookings → CounterOffers → Bids → JobInvites → Jobs → Notifications/
 *   AdminLogs → ArtistChildTables → CasterProfile → ArtistProfile → User.
 */
import { prisma } from '../../src/lib/prisma'

const EMAIL = { endsWith: '@castflow.test' as const }

export async function cleanupTestData(): Promise<void> {
  // ── Snapshot the test domain ─────────────────────────────────────────
  const [users, casters, artists] = await Promise.all([
    prisma.user.findMany({ where: { email: EMAIL }, select: { id: true } }),
    prisma.casterProfile.findMany({
      where: { user: { email: EMAIL } },
      select: { id: true },
    }),
    prisma.artistProfile.findMany({
      where: { user: { email: EMAIL } },
      select: { id: true },
    }),
  ])
  const userIds = users.map((u) => u.id)
  const casterIds = casters.map((c) => c.id)
  const artistIds = artists.map((a) => a.id)
  if (userIds.length === 0 && casterIds.length === 0 && artistIds.length === 0) return

  // ── Jobs + bookings + threads owned by the snapshot. Independent reads
  //    so we can fire them in parallel.
  const [jobs, bookings, threads] = await Promise.all([
    casterIds.length > 0
      ? prisma.job.findMany({ where: { casterId: { in: casterIds } }, select: { id: true } })
      : Promise.resolve([] as Array<{ id: string }>),
    casterIds.length > 0 || artistIds.length > 0
      ? prisma.booking.findMany({
          where: {
            OR: [
              ...(artistIds.length > 0 ? [{ artistId: { in: artistIds } }] : []),
              ...(casterIds.length > 0 ? [{ casterId: { in: casterIds } }] : []),
            ],
          },
          select: { id: true, bidId: true, jobId: true },
        })
      : Promise.resolve([] as Array<{ id: string; bidId: string; jobId: string }>),
    casterIds.length > 0
      ? prisma.messageThread.findMany({
          where: { jobId: { in: [] } }, // refined below once we know jobIds
          select: { id: true },
        })
      : Promise.resolve([] as Array<{ id: string }>),
  ])
  const jobIds = jobs.map((j) => j.id)
  const bookingIds = bookings.map((b) => b.id)
  const bidIds = bookings.map((b) => b.bidId)
  // Bookings can reference jobs owned by non-test casters (artist on outside
  // job), so union those job ids in as well.
  for (const b of bookings) if (!jobIds.includes(b.jobId)) jobIds.push(b.jobId)
  const messageThreads =
    jobIds.length > 0
      ? await prisma.messageThread.findMany({
          where: { jobId: { in: jobIds } },
          select: { id: true },
        })
      : []
  const threadIds = [...threads, ...messageThreads].map((t) => t.id)

  // ── Stage 1: leaf-level rows (most dependent first) ──────────────────
  if (threadIds.length > 0) {
    await prisma.message.deleteMany({ where: { threadId: { in: threadIds } } })
    await prisma.messageThread.deleteMany({ where: { id: { in: threadIds } } })
  }
  if (bookingIds.length > 0) {
    await prisma.review.deleteMany({ where: { bookingId: { in: bookingIds } } })
    await prisma.dispute.deleteMany({ where: { bookingId: { in: bookingIds } } })
    await prisma.payment.deleteMany({ where: { bookingId: { in: bookingIds } } })
    await prisma.contract.deleteMany({ where: { bookingId: { in: bookingIds } } })
    await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } })
  }

  // CounterOffers reference bids — kill them before bids.
  if (bidIds.length > 0) {
    await prisma.counterOffer.deleteMany({ where: { bidId: { in: bidIds } } })
  }
  if (artistIds.length > 0) {
    await prisma.counterOffer.deleteMany({ where: { bid: { artistId: { in: artistIds } } } })
  }

  if (artistIds.length > 0) {
    await prisma.jobInvite.deleteMany({ where: { artistId: { in: artistIds } } })
  }
  if (jobIds.length > 0) {
    await prisma.jobInvite.deleteMany({ where: { jobId: { in: jobIds } } })
  }

  if (bidIds.length > 0) {
    await prisma.bid.deleteMany({ where: { id: { in: bidIds } } })
  }
  if (artistIds.length > 0) {
    await prisma.bid.deleteMany({ where: { artistId: { in: artistIds } } })
  }
  if (jobIds.length > 0) {
    await prisma.bid.deleteMany({ where: { jobId: { in: jobIds } } })
  }

  if (jobIds.length > 0) {
    await prisma.job.deleteMany({ where: { id: { in: jobIds } } })
  }

  // Reviews where reviewee is a test profile (rare — booking-based deletes
  // should have caught them, but be defensive).
  if (artistIds.length > 0) {
    await prisma.review.deleteMany({ where: { revieweeId: { in: artistIds } } })
  }
  if (casterIds.length > 0) {
    await prisma.review.deleteMany({ where: { revieweeId: { in: casterIds } } })
  }

  // Artist child tables (no cascade in schema).
  if (artistIds.length > 0) {
    await prisma.modelStats.deleteMany({ where: { artistProfileId: { in: artistIds } } })
    await prisma.actorStats.deleteMany({ where: { artistProfileId: { in: artistIds } } })
    await prisma.artistSkill.deleteMany({ where: { artistProfileId: { in: artistIds } } })
    await prisma.portfolioItem.deleteMany({ where: { artistProfileId: { in: artistIds } } })
  }

  // ── Stage 2: user-scoped logs ────────────────────────────────────────
  if (userIds.length > 0) {
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.adminLog.deleteMany({ where: { adminId: { in: userIds } } })
  }

  // ── Stage 3: profiles ────────────────────────────────────────────────
  if (casterIds.length > 0) {
    await prisma.casterProfile.deleteMany({ where: { id: { in: casterIds } } })
  }
  if (artistIds.length > 0) {
    await prisma.artistProfile.deleteMany({ where: { id: { in: artistIds } } })
  }

  // ── Stage 4: users (cascade now has nothing to delete) ───────────────
  if (userIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  }
}
