import { Hono } from 'hono'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/requireRole'
import { prisma } from '../../lib/prisma'

type AppEnv = { Variables: { user: { id: string; role: string } } }

export const adminAnalyticsRoutes = new Hono<AppEnv>()
adminAnalyticsRoutes.use('*', authenticate, requireRole('admin'))

const WEEKS = 8

/** Monday 00:00 UTC of the week containing `d`. */
function startOfWeek(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = x.getUTCDay() // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day
  x.setUTCDate(x.getUTCDate() + diff)
  return x
}

function bucketByWeek(dates: Date[], weekStarts: Date[]): number[] {
  const counts = new Array(weekStarts.length).fill(0) as number[]
  const starts = weekStarts.map((w) => w.getTime())
  for (const d of dates) {
    const t = d.getTime()
    for (let i = weekStarts.length - 1; i >= 0; i--) {
      if (t >= starts[i]!) {
        counts[i]! += 1
        break
      }
    }
  }
  return counts
}

adminAnalyticsRoutes.get('/summary', async (c) => {
  const now = new Date()
  const thisWeekStart = startOfWeek(now)
  const firstWeekStart = new Date(thisWeekStart)
  firstWeekStart.setUTCDate(firstWeekStart.getUTCDate() - 7 * (WEEKS - 1))

  const weekStarts: Date[] = Array.from({ length: WEEKS }, (_, i) => {
    const w = new Date(firstWeekStart)
    w.setUTCDate(w.getUTCDate() + i * 7)
    return w
  })

  const [
    totalUsers,
    totalArtists,
    totalCasters,
    pendingApplications,
    openDisputes,
    totalJobs,
    totalBookings,
    totalDisputes,
    jobsWithBooking,
    bookingsThisWeek,
    activeSubscriptions,
    recentUsers,
    recentJobs,
    bookingTimes,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.artistProfile.count(),
    prisma.casterProfile.count(),
    prisma.artistProfile.count({ where: { approvalStatus: 'pending' } }),
    prisma.dispute.count({ where: { status: { in: ['open', 'under_review'] } } }),
    prisma.job.count(),
    prisma.booking.count(),
    prisma.dispute.count(),
    prisma.job.count({ where: { bookings: { some: {} } } }),
    prisma.booking.count({ where: { createdAt: { gte: thisWeekStart } } }),
    // Platform revenue is subscription-based — surface the count of currently
    // active/trialing caster subscriptions as the headline MRR proxy. (Exact
    // MRR in GBP would require reading the Stripe price; out of scope here.)
    prisma.casterSubscription.count({
      where: { status: { in: ['active', 'trialing'] } },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: firstWeekStart } },
      select: { createdAt: true },
    }),
    prisma.job.findMany({
      where: { createdAt: { gte: firstWeekStart } },
      select: { createdAt: true },
    }),
    // Time from job posted to booking created, over a recent sample.
    prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { createdAt: true, job: { select: { createdAt: true } } },
    }),
  ])

  const toPoints = (counts: number[]) =>
    weekStarts.map((w, i) => ({ weekStart: w.toISOString().slice(0, 10), count: counts[i] ?? 0 }))

  const ttbHours = bookingTimes
    .map((b) => (b.createdAt.getTime() - b.job.createdAt.getTime()) / 3_600_000)
    .filter((h) => Number.isFinite(h) && h >= 0)
  const avgTimeToBookingHours =
    ttbHours.length > 0 ? ttbHours.reduce((a, b) => a + b, 0) / ttbHours.length : null

  return c.json({
    success: true,
    data: {
      totalUsers,
      totalArtists,
      totalCasters,
      pendingApplications,
      openDisputes,
      bookingsThisWeek,
      activeSubscriptions,
      newUsersWeekly: toPoints(
        bucketByWeek(
          recentUsers.map((u) => u.createdAt),
          weekStarts
        )
      ),
      jobsWeekly: toPoints(
        bucketByWeek(
          recentJobs.map((j) => j.createdAt),
          weekStarts
        )
      ),
      bookingFillRate: totalJobs > 0 ? jobsWithBooking / totalJobs : 0,
      disputeRate: totalBookings > 0 ? totalDisputes / totalBookings : 0,
      avgTimeToBookingHours,
    },
  })
})
