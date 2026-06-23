import { prisma } from '../lib/prisma'
import { AppError } from '../errors'

// Rules from apps/api/CLAUDE.md:
//   - All business logic goes here, NOT in route handlers
//   - Multi-table operations must use prisma.$transaction()
//   - Throw AppError for all expected failures

export class CasterService {
  protected static readonly db = prisma

  /**
   * Public, unauthenticated caster profile — the company-facing page an artist
   * (or anyone) can view. Sensitive fields (contactName, phone, stripeCustomerId,
   * userId) are excluded by the select: anything not listed never leaves the DB.
   * Includes the caster's currently-open public jobs and the reviews artists
   * have left about them.
   */
  static async getPublicProfile(id: string) {
    const caster = await prisma.casterProfile.findUnique({
      where: { id },
      select: {
        id: true,
        companyName: true,
        companyType: true,
        logoUrl: true,
        website: true,
        createdAt: true,
      },
    })
    if (!caster) throw new AppError('NOT_FOUND', 'Caster not found', 404)

    // The denormalized CasterProfile.jobsPosted / ratingAvg / ratingCount columns
    // can drift (they are only bumped on certain write paths and start at 0 in
    // seed data), which previously made the header read "0 shoots / no reviews"
    // while the lists below showed real jobs + reviews. Derive these counts live
    // so the header is always consistent with the data actually rendered.
    const [jobsPosted, ratingAgg] = await Promise.all([
      prisma.job.count({ where: { casterId: id } }),
      prisma.review.aggregate({
        where: { casterRevieweeId: id, isRemoved: false },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ])
    const ratingCount = ratingAgg._count._all
    const ratingAvg = ratingAgg._avg.rating ?? null

    const activeJobs = await prisma.job.findMany({
      where: {
        casterId: id,
        status: 'active',
        visibility: 'public',
        applicationDeadline: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        title: true,
        category: true,
        locationCity: true,
        shootDate: true,
        paymentType: true,
        rateAmount: true,
        rateSetBy: true,
        coverImageUrl: true,
        headcountRequired: true,
        headcountFilled: true,
      },
    })

    const reviews = await prisma.review.findMany({
      where: { casterRevieweeId: id, isRemoved: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        booking: { select: { job: { select: { id: true, title: true } } } },
      },
    })

    return { ...caster, jobsPosted, ratingAvg, ratingCount, activeJobs, reviews }
  }
}
