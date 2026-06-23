import type { CreateJobInput, UpdateJobInput } from '@castflow/validators'
import type {
  JobPaymentType,
  JobStatus,
  RateSetBy,
  JobCategory,
  JobVisibility,
  Prisma,
} from '@prisma/client'
import { prisma } from '../lib/prisma'
import { env } from '../lib/env'
import { AppError } from '../errors'
import { NotificationService } from './NotificationService'
import { SubscriptionService } from './SubscriptionService'

// Lazy expiry: a job is "live" while status='active' AND now < applicationDeadline.
// We never run a scheduler; reads compute the effective state, writes flip on demand.

async function getCasterProfileId(userId: string): Promise<string> {
  const caster = await prisma.casterProfile.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!caster) throw new AppError('NOT_FOUND', 'Caster profile not found', 404)
  return caster.id
}

function autoExpiresAt(shootDate: Date): Date {
  // Default lifecycle ends 7 days after the shoot date if no explicit value is given.
  const d = new Date(shootDate)
  d.setDate(d.getDate() + 7)
  return d
}

interface PublicJobFilters {
  category?: JobCategory
  locationCity?: string
  paymentType?: JobPaymentType
  search?: string
  cursor?: string
  limit?: number
}

export class JobService {
  protected static readonly db = prisma

  // ── Caster: create / update / list mine ───────────────────────────────────

  static async createJob(userId: string, input: CreateJobInput) {
    const casterId = await getCasterProfileId(userId)
    await SubscriptionService.assertActiveSubscription(casterId)

    if (input.paymentType === 'hourly' && input.rateSetBy === 'caster' && !input.rateAmount) {
      throw new AppError('VALIDATION_ERROR', 'Hourly jobs require an hourly rate', 400, {
        rateAmount: ['Required when caster sets the rate'],
      })
    }

    return prisma.job.create({
      data: {
        casterId,
        title: input.title,
        description: input.description,
        category: input.category,
        subcategory: input.subcategory ?? null,
        coverImageUrl: input.coverImageUrl ?? null,
        visibility: input.visibility as JobVisibility,
        status: 'active',
        genderRequired: input.genderRequired,
        ageMin: input.ageMin ?? null,
        ageMax: input.ageMax ?? null,
        locationCity: input.locationCity,
        ...(input.physicalRequirements
          ? { physicalRequirements: input.physicalRequirements as Prisma.InputJsonValue }
          : {}),
        skillsRequired: input.skillsRequired ?? [],
        shootDate: new Date(input.shootDate),
        shootEndDate: input.shootEndDate ? new Date(input.shootEndDate) : null,
        shootDurationHours: input.shootDurationHours,
        paymentType: input.paymentType as JobPaymentType,
        rateSetBy: input.rateSetBy as RateSetBy,
        rateAmount: input.rateAmount ?? null,
        requiresNda: input.requiresNda,
        exclusivity: input.exclusivity,
        usageRights: input.usageRights,
        headcountRequired: input.headcountRequired,
        applicationDeadline: new Date(input.applicationDeadline),
        autoExpiresAt: autoExpiresAt(new Date(input.shootDate)),
      },
    })
  }

  static async updateJob(userId: string, jobId: string, input: UpdateJobInput) {
    const casterId = await getCasterProfileId(userId)
    const job = await prisma.job.findUnique({ where: { id: jobId } })
    if (!job) throw new AppError('NOT_FOUND', 'Job not found', 404)
    if (job.casterId !== casterId) throw new AppError('FORBIDDEN', 'Not your job', 403)
    if (job.status !== 'active' && job.status !== 'draft') {
      throw new AppError('INVALID_STATE', `Cannot edit a ${job.status} job`, 400)
    }

    const data: Record<string, unknown> = {}
    if (input.title !== undefined) data.title = input.title
    if (input.description !== undefined) data.description = input.description
    if (input.subcategory !== undefined) data.subcategory = input.subcategory
    if (input.coverImageUrl !== undefined) data.coverImageUrl = input.coverImageUrl
    if (input.genderRequired !== undefined) data.genderRequired = input.genderRequired
    if (input.ageMin !== undefined) data.ageMin = input.ageMin
    if (input.ageMax !== undefined) data.ageMax = input.ageMax
    if (input.locationCity !== undefined) data.locationCity = input.locationCity
    if (input.physicalRequirements !== undefined)
      data.physicalRequirements = input.physicalRequirements as Prisma.InputJsonValue
    if (input.skillsRequired !== undefined) data.skillsRequired = input.skillsRequired
    if (input.shootDate !== undefined) {
      const d = new Date(input.shootDate)
      data.shootDate = d
      data.autoExpiresAt = autoExpiresAt(d)
    }
    if (input.shootDurationHours !== undefined) data.shootDurationHours = input.shootDurationHours
    if (input.rateAmount !== undefined) data.rateAmount = input.rateAmount
    if (input.requiresNda !== undefined) data.requiresNda = input.requiresNda
    if (input.exclusivity !== undefined) data.exclusivity = input.exclusivity
    if (input.usageRights !== undefined) data.usageRights = input.usageRights
    if (input.headcountRequired !== undefined) data.headcountRequired = input.headcountRequired
    if (input.applicationDeadline !== undefined)
      data.applicationDeadline = new Date(input.applicationDeadline)

    // Detect critical-field changes BEFORE the update so we can diff against
    // the persisted values, then notify all non-rejected bidders (PRD §10.3).
    const criticalChanges: string[] = []
    if (
      input.shootDate !== undefined &&
      new Date(input.shootDate).getTime() !== job.shootDate.getTime()
    ) {
      criticalChanges.push('shoot date')
    }
    if (
      input.rateAmount !== undefined &&
      Number(input.rateAmount) !== Number(job.rateAmount ?? 0)
    ) {
      criticalChanges.push('rate')
    }
    if (
      input.locationCity !== undefined &&
      input.locationCity.toLowerCase() !== job.locationCity.toLowerCase()
    ) {
      criticalChanges.push('location')
    }
    if (
      input.applicationDeadline !== undefined &&
      new Date(input.applicationDeadline).getTime() !== job.applicationDeadline.getTime()
    ) {
      criticalChanges.push('application deadline')
    }

    const updated = await prisma.job.update({ where: { id: jobId }, data })

    if (criticalChanges.length > 0) {
      const bidders = await prisma.bid.findMany({
        where: { jobId, status: { in: ['pending', 'shortlisted'] } },
        select: { id: true, artist: { select: { userId: true } } },
      })
      const summary = criticalChanges.join(', ')
      for (const bid of bidders) {
        void NotificationService.notifyEvent({
          userId: bid.artist.userId,
          type: 'job_critical_change',
          title: 'A job you bid on was updated',
          body: `The caster changed the ${summary} for "${job.title}". Review and re-confirm your bid.`,
          relatedEntityType: 'bid',
          relatedEntityId: bid.id,
          email: { ctaUrl: `${env.FRONTEND_URL}/artist/bids` },
        })
      }
    }

    return updated
  }

  static async listMyJobs(
    userId: string,
    opts: { status?: JobStatus; cursor?: string; limit?: number } = {}
  ) {
    const casterId = await getCasterProfileId(userId)
    const take = Math.min(Math.max(opts.limit ?? 25, 1), 100)
    const rows = await prisma.job.findMany({
      where: { casterId, ...(opts.status ? { status: opts.status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
      include: { _count: { select: { bids: true } } },
    })
    const hasNext = rows.length > take
    const items = hasNext ? rows.slice(0, take) : rows
    return { items, nextCursor: hasNext ? (items.at(-1)?.id ?? null) : null }
  }

  static async cancelJob(userId: string, jobId: string) {
    const casterId = await getCasterProfileId(userId)
    const job = await prisma.job.findUnique({ where: { id: jobId } })
    if (!job) throw new AppError('NOT_FOUND', 'Job not found', 404)
    if (job.casterId !== casterId) throw new AppError('FORBIDDEN', 'Not your job', 403)
    if (job.status === 'filled' || job.status === 'cancelled') {
      throw new AppError('INVALID_STATE', `Job is already ${job.status}`, 400)
    }

    return prisma.$transaction(async (tx) => {
      const cancelled = await tx.job.update({
        where: { id: jobId },
        data: { status: 'cancelled' },
      })
      // Expire any outstanding pending bids so artists are unblocked.
      await tx.bid.updateMany({
        where: { jobId, status: 'pending' },
        data: { status: 'expired' },
      })
      return cancelled
    })
  }

  /**
   * Admin force-remove a job (PRD §6.5). Flips status to cancelled and expires
   * pending/shortlisted bids. The platform holds no job money (fees are settled
   * off-platform), so there is nothing to refund — the `reason` is retained for
   * the admin audit trail via the calling route's AdminLog.
   */
  static async adminRemove(jobId: string, _reason: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } })
    if (!job) throw new AppError('NOT_FOUND', 'Job not found', 404)
    if (job.status === 'cancelled') return job

    await prisma.$transaction(async (tx) => {
      await tx.job.update({ where: { id: jobId }, data: { status: 'cancelled' } })
      await tx.bid.updateMany({
        where: { jobId, status: { in: ['pending', 'shortlisted'] } },
        data: { status: 'expired' },
      })
    })

    return prisma.job.findUnique({ where: { id: jobId } })
  }

  // ── Public: list + detail (artist-facing) ─────────────────────────────────

  /**
   * Strip caster-only fields before returning a job to an artist.
   * shootLocationDetail is hidden until contract is fully_signed (separate flow).
   * callTime + shootLocationDetail are kept null at this stage; they are populated
   * server-side as the booking → contract progression happens.
   */
  private static stripPublicJob<
    T extends { shootLocationDetail: string | null; callTime: Date | null },
  >(job: T): T {
    return { ...job, shootLocationDetail: null, callTime: null }
  }

  static async listPublic(filters: PublicJobFilters) {
    const take = Math.min(Math.max(filters.limit ?? 25, 1), 100)
    const now = new Date()

    const where = {
      status: 'active' as const,
      visibility: 'public' as const,
      applicationDeadline: { gt: now }, // lazy expiry
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.locationCity
        ? { locationCity: { contains: filters.locationCity, mode: 'insensitive' as const } }
        : {}),
      ...(filters.paymentType ? { paymentType: filters.paymentType } : {}),
      ...(filters.search
        ? {
            OR: [
              { title: { contains: filters.search, mode: 'insensitive' as const } },
              { description: { contains: filters.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const rows = await prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
      include: {
        caster: { select: { companyName: true, ratingAvg: true, ratingCount: true } },
      },
    })

    // Defence in depth: BidService.acceptBid flips Job.status → 'filled' once
    // the last seat goes, so a fully-saturated job should already be excluded
    // by `status: 'active'` above. We filter again here so a stuck status flag
    // can't surface a job that has no remaining seats.
    const seated = rows.filter((j) => j.headcountFilled < j.headcountRequired)
    const hasNext = seated.length > take
    const items = (hasNext ? seated.slice(0, take) : seated).map((j) =>
      JobService.stripPublicJob(j)
    )
    return { items, nextCursor: hasNext ? (items.at(-1)?.id ?? null) : null }
  }

  static async getPublicDetail(jobId: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        caster: { select: { companyName: true, ratingAvg: true, ratingCount: true } },
      },
    })
    if (!job || job.status !== 'active' || job.visibility !== 'public') {
      throw new AppError('NOT_FOUND', 'Job not found', 404)
    }
    if (new Date() > job.applicationDeadline) {
      throw new AppError('JOB_EXPIRED', 'Application deadline has passed', 410)
    }
    if (job.headcountFilled >= job.headcountRequired) {
      throw new AppError('JOB_FILLED', 'This job is fully booked', 410)
    }
    return JobService.stripPublicJob(job)
  }
}
