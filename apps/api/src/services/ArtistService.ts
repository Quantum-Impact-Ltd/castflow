import type {
  ArtistPersonalInfoInput,
  ModelStatsInput,
  ActorStatsInput,
  ArtistExperienceInput,
} from '@castflow/validators'
import { prisma } from '../lib/prisma'
import { env } from '../lib/env'
import { AppError } from '../errors'
import { NotificationService } from './NotificationService'
import { EmailService } from './EmailService'
import { renderCompCardPdf } from '../templates/comp-card-pdf'

async function getProfileByUser(userId: string) {
  const profile = await prisma.artistProfile.findUnique({
    where: { userId },
    include: { modelStats: true, actorStats: true, skills: true, portfolioItems: true },
  })
  if (!profile) {
    throw new AppError('NOT_FOUND', 'Artist profile not found', 404)
  }
  return profile
}

export class ArtistService {
  protected static readonly db = prisma

  static async getMyProfile(userId: string) {
    return getProfileByUser(userId)
  }

  static async updatePersonalInfo(userId: string, input: ArtistPersonalInfoInput) {
    const profile = await getProfileByUser(userId)
    return prisma.artistProfile.update({
      where: { id: profile.id },
      data: {
        dob: new Date(input.dob),
        gender: input.gender,
        pronouns: input.pronouns ?? null,
        city: input.city,
        bio: input.bio ?? null,
      },
    })
  }

  static async updateModelStats(userId: string, input: ModelStatsInput) {
    const profile = await getProfileByUser(userId)
    if (profile.artistType !== 'model') {
      throw new AppError('INVALID_STATE', 'Profile is not a model artist', 400)
    }
    const data = {
      heightCm: input.heightCm,
      weightKg: input.weightKg ?? null,
      dressSize: input.dressSize,
      shoeSize: input.shoeSize,
      bustCm: input.bustCm ?? null,
      waistCm: input.waistCm ?? null,
      hipCm: input.hipCm ?? null,
      hairColour: input.hairColour,
      eyeColour: input.eyeColour,
      skinTone: input.skinTone,
    }
    return prisma.modelStats.upsert({
      where: { artistProfileId: profile.id },
      create: { artistProfileId: profile.id, ...data },
      update: data,
    })
  }

  static async updateActorStats(userId: string, input: ActorStatsInput) {
    const profile = await getProfileByUser(userId)
    if (profile.artistType !== 'actor') {
      throw new AppError('INVALID_STATE', 'Profile is not an actor artist', 400)
    }
    const data = {
      heightCm: input.heightCm,
      hairColour: input.hairColour,
      eyeColour: input.eyeColour,
      voiceType: input.voiceType ?? null,
      spotlightUrl: input.spotlightUrl ? input.spotlightUrl : null,
      equityMember: input.equityMember,
      ageRangeMin: input.ageRangeMin,
      ageRangeMax: input.ageRangeMax,
    }
    return prisma.actorStats.upsert({
      where: { artistProfileId: profile.id },
      create: { artistProfileId: profile.id, ...data },
      update: data,
    })
  }

  static async updateExperience(userId: string, input: ArtistExperienceInput) {
    const profile = await getProfileByUser(userId)
    return prisma.artistProfile.update({
      where: { id: profile.id },
      data: {
        experienceLevel: input.experienceLevel,
        instagramHandle: input.instagramHandle ?? null,
      },
    })
  }

  static async submitForReview(userId: string) {
    const profile = await getProfileByUser(userId)

    if (profile.approvalStatus === 'approved') {
      throw new AppError('INVALID_STATE', 'Profile is already approved', 400)
    }

    const missing: string[] = []
    if (!profile.dob) missing.push('dob')
    if (!profile.gender) missing.push('gender')
    if (!profile.city) missing.push('city')
    if (!profile.experienceLevel) missing.push('experienceLevel')
    if (profile.artistType === 'model' && !profile.modelStats) missing.push('modelStats')
    if (profile.artistType === 'actor' && !profile.actorStats) missing.push('actorStats')
    // PRD §8.1 step 5 — government ID required before review.
    if (!profile.idDocumentUrl) missing.push('idDocumentUrl')

    if (missing.length > 0) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Profile is incomplete — finish all required sections before submitting',
        400,
        { missing }
      )
    }

    // PRD §8.1 step 4 — minimum 3 portfolio photos before review.
    const photoCount = profile.portfolioItems.filter((p) => p.type === 'photo').length
    if (photoCount < 3) {
      throw new AppError(
        'MIN_PORTFOLIO_REQUIRED',
        'Upload at least 3 portfolio photos before submitting',
        400,
        { portfolioItems: [`Have ${photoCount}, need 3`] }
      )
    }

    return prisma.artistProfile.update({
      where: { id: profile.id },
      data: {
        submittedAt: new Date(),
        approvalStatus: 'pending',
      },
    })
  }

  // ── Admin actions ──────────────────────────────────────────────────────────

  static async listApplications(opts: {
    status?: 'pending' | 'approved' | 'rejected'
    cursor?: string
    limit?: number
  }) {
    const take = Math.min(Math.max(opts.limit ?? 25, 1), 100)
    const where = opts.status
      ? { approvalStatus: opts.status, submittedAt: { not: null } }
      : { submittedAt: { not: null } }

    // List view shows headline + a count badge; the actual portfolio is
    // fetched per-row when admin opens the detail. 25 rows × N portfolio
    // items per row used to be a heavy join — we project to _count instead.
    const rows = await prisma.artistProfile.findMany({
      where,
      include: {
        modelStats: true,
        actorStats: true,
        _count: { select: { portfolioItems: true } },
      },
      orderBy: { submittedAt: 'asc' },
      take: take + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    })

    const hasNext = rows.length > take
    const items = hasNext ? rows.slice(0, take) : rows
    return { items, nextCursor: hasNext ? (items.at(-1)?.id ?? null) : null }
  }

  static async approveApplication(args: { profileId: string; adminId: string; notes?: string }) {
    const profile = await prisma.artistProfile.findUnique({
      where: { id: args.profileId },
    })
    if (!profile) throw new AppError('NOT_FOUND', 'Artist profile not found', 404)
    if (profile.approvalStatus === 'approved') return profile

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.artistProfile.update({
        where: { id: profile.id },
        data: {
          approvalStatus: 'approved',
          approvedAt: new Date(),
          approvedById: args.adminId,
          approvalNotes: args.notes ?? null,
          // Admin approval = ID has been visually checked — unlock the
          // Verified badge (PRD §13.1).
          idVerified: true,
        },
      })
      await tx.user.update({
        where: { id: profile.userId },
        data: { approvalStatus: 'approved' },
      })
      await tx.adminLog.create({
        data: {
          adminId: args.adminId,
          action: 'approve_artist',
          entityType: 'artist_profile',
          entityId: profile.id,
          notes: args.notes ?? null,
        },
      })
      return row
    })

    void NotificationService.notifyEvent({
      userId: profile.userId,
      type: 'artist_approved',
      title: 'Your CastFlow profile is approved!',
      body: 'Welcome to CastFlow — you can now bid on jobs and accept invites.',
      relatedEntityType: 'artist_profile',
      relatedEntityId: profile.id,
      email: {
        ctaUrl: `${env.FRONTEND_URL}/artist/dashboard`,
        ctaLabel: 'Go to dashboard',
      },
    })

    return updated
  }

  static async rejectApplication(args: { profileId: string; adminId: string; reason: string }) {
    if (!args.reason || args.reason.trim().length < 5) {
      throw new AppError('VALIDATION_ERROR', 'Rejection reason is required', 400, {
        reason: ['Must be at least 5 characters'],
      })
    }
    const profile = await prisma.artistProfile.findUnique({
      where: { id: args.profileId },
    })
    if (!profile) throw new AppError('NOT_FOUND', 'Artist profile not found', 404)
    if (profile.approvalStatus === 'rejected') return profile

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.artistProfile.update({
        where: { id: profile.id },
        data: {
          approvalStatus: 'rejected',
          approvalNotes: args.reason,
          approvedById: args.adminId,
          approvedAt: new Date(),
        },
      })
      await tx.user.update({
        where: { id: profile.userId },
        data: { approvalStatus: 'rejected' },
      })
      await tx.adminLog.create({
        data: {
          adminId: args.adminId,
          action: 'reject_artist',
          entityType: 'artist_profile',
          entityId: profile.id,
          notes: args.reason,
        },
      })
      return row
    })

    void NotificationService.notifyEvent({
      userId: profile.userId,
      type: 'artist_rejected',
      title: 'Your CastFlow application was not approved',
      body: `Reason: ${args.reason}`,
      relatedEntityType: 'artist_profile',
      relatedEntityId: profile.id,
      email: { ctaUrl: `${env.FRONTEND_URL}/onboarding/pending` },
    })

    return updated
  }

  /**
   * Render a comp-card PDF for a public, approved artist. Returns the raw
   * Buffer so the route can stream it (no R2 caching for MVP — the data
   * changes whenever the artist edits their profile, and rendering is
   * cheap enough to do on demand).
   */
  static async generateCompCard(profileId: string): Promise<Buffer> {
    const profile = await prisma.artistProfile.findUnique({
      where: { id: profileId },
      include: {
        modelStats: true,
        actorStats: true,
        skills: true,
        portfolioItems: {
          where: { isApproved: true, type: 'photo' },
          orderBy: { displayOrder: 'asc' },
          take: 6,
        },
      },
    })
    if (!profile) throw new AppError('NOT_FOUND', 'Artist profile not found', 404)
    if (profile.approvalStatus !== 'approved') {
      throw new AppError('FORBIDDEN', 'Comp-card is only available for approved artists', 403)
    }

    return renderCompCardPdf({
      firstName: profile.firstName,
      artistType: profile.artistType,
      city: profile.city ?? 'UK',
      bio: profile.bio,
      experienceLevel: profile.experienceLevel ?? 'new_face',
      ratingAvg: profile.ratingAvg ? Number(profile.ratingAvg) : null,
      ratingCount: profile.ratingCount,
      jobsCompleted: profile.jobsCompleted,
      modelStats: profile.modelStats
        ? {
            heightCm: profile.modelStats.heightCm,
            dressSize: profile.modelStats.dressSize,
            shoeSize: profile.modelStats.shoeSize,
            bustCm: profile.modelStats.bustCm,
            waistCm: profile.modelStats.waistCm,
            hipCm: profile.modelStats.hipCm,
            hairColour: profile.modelStats.hairColour,
            eyeColour: profile.modelStats.eyeColour,
            skinTone: profile.modelStats.skinTone,
          }
        : null,
      actorStats: profile.actorStats
        ? {
            heightCm: profile.actorStats.heightCm,
            hairColour: profile.actorStats.hairColour,
            eyeColour: profile.actorStats.eyeColour,
            voiceType: profile.actorStats.voiceType,
            ageRangeMin: profile.actorStats.ageRangeMin,
            ageRangeMax: profile.actorStats.ageRangeMax,
          }
        : null,
      skills: profile.skills.map((s) => ({
        skillType: s.skillType,
        skillValue: s.skillValue,
      })),
      portfolioPhotos: profile.portfolioItems.map((p) => p.url),
    })
  }

  /**
   * Fire a welcome email after a user verifies their email. Better Auth's
   * `emailVerification` hook calls this via a small adapter (see auth.ts).
   * Idempotent at the EmailService layer — duplicate sends are unlikely
   * since BA fires the verify hook once per token.
   */
  static async sendWelcomeAfterVerification(args: {
    userId: string
    email: string
    role: 'artist' | 'caster'
  }) {
    let firstName = 'there'
    if (args.role === 'artist') {
      const profile = await prisma.artistProfile.findUnique({
        where: { userId: args.userId },
        select: { firstName: true },
      })
      if (profile?.firstName) firstName = profile.firstName
    } else {
      const profile = await prisma.casterProfile.findUnique({
        where: { userId: args.userId },
        select: { contactName: true },
      })
      if (profile?.contactName) firstName = profile.contactName.split(' ')[0] ?? 'there'
    }
    await EmailService.sendWelcomeEmail({ to: args.email, role: args.role, firstName })
  }
}
