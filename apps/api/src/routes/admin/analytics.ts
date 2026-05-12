import { Hono } from 'hono'
import { authenticate } from '../../middleware/authenticate'
import { requireRole } from '../../middleware/requireRole'
import { prisma } from '../../lib/prisma'

type AppEnv = { Variables: { user: { id: string; role: string } } }

export const adminAnalyticsRoutes = new Hono<AppEnv>()
adminAnalyticsRoutes.use('*', authenticate, requireRole('admin'))

adminAnalyticsRoutes.get('/summary', async (c) => {
  const [
    totalUsers,
    totalArtists,
    totalCasters,
    totalJobs,
    activeJobs,
    totalBookings,
    completedBookings,
    openDisputes,
    grossVolume,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.artistProfile.count(),
    prisma.casterProfile.count(),
    prisma.job.count(),
    prisma.job.count({ where: { status: 'active' } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'completed' } }),
    prisma.dispute.count({ where: { status: { in: ['open', 'under_review'] } } }),
    prisma.payment.aggregate({
      where: { escrowStatus: { in: ['held', 'released'] } },
      _sum: { grossAmount: true },
    }),
  ])

  return c.json({
    success: true,
    data: {
      totalUsers,
      totalArtists,
      totalCasters,
      totalJobs,
      activeJobs,
      totalBookings,
      completedBookings,
      openDisputes,
      grossVolumeGbp: Number(grossVolume._sum.grossAmount ?? 0),
    },
  })
})
