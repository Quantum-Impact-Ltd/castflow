import type {
  ArtistPersonalInfoInput,
  ModelStatsInput,
  ActorStatsInput,
  ArtistExperienceInput,
  UpdateArtistTypeInput,
  ReplaceSkillsInput,
  UpdateAvailabilityInput,
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

  /**
   * Public, unauthenticated artist profile (PRD §8.4 — the shareable
   * `castflow.co.uk/artists/:id` page). Approved artists only. Sensitive fields
   * (lastName, dob, idDocumentUrl, userId, approvalNotes, strikeCount,
   * approvedById) are excluded by the select — anything not listed never leaves
   * the DB. Same projection as the caster talent detail, minus the auth gate.
   */
  static async getPublicProfile(id: string) {
    const profile = await prisma.artistProfile.findUnique({
      where: { id },
      select: {
        id: true,
        artistType: true,
        firstName: true,
        gender: true,
        pronouns: true,
        city: true,
        bio: true,
        experienceLevel: true,
        instagramHandle: true,
        availabilityStatus: true,
        approvalStatus: true,
        idVerified: true,
        ratingAvg: true,
        ratingCount: true,
        jobsCompleted: true,
        responseRate: true,
        createdAt: true,
        modelStats: true,
        actorStats: true,
        skills: true,
        portfolioItems: { where: { isApproved: true }, orderBy: { displayOrder: 'asc' } },
      },
    })
    if (!profile || profile.approvalStatus !== 'approved') {
      throw new AppError('NOT_FOUND', 'Artist not found', 404)
    }
    return profile
  }

  /** Toggle the artist's discoverability in talent search (PRD §8.13). */
  static async updateAvailability(userId: string, input: UpdateAvailabilityInput) {
    const profile = await getProfileByUser(userId)
    await prisma.artistProfile.update({
      where: { id: profile.id },
      data: { availabilityStatus: input.availabilityStatus },
    })
    return getProfileByUser(userId)
  }

  /**
   * Delete the artist's account (PRD §8.13). Blocked while there are active
   * bookings or escrow that hasn't cleared. Hard-deletes the user, which
   * cascades to the profile/sessions/accounts via the onDelete relation.
   *
   * NOTE for the DB-verified pass: accounts that have *historical*
   * (completed/cancelled) bookings will hit the Booking→ArtistProfile FK on a
   * hard delete — those should be soft-deleted/anonymised instead. Accounts
   * with no booking history delete cleanly.
   */
  static async deleteAccount(userId: string) {
    const profile = await getProfileByUser(userId)
    const activeBookings = await prisma.booking.count({
      where: { artistId: profile.id, status: { in: ['pending_payment', 'confirmed', 'disputed'] } },
    })
    if (activeBookings > 0) {
      throw new AppError(
        'CONFLICT',
        'You have active bookings. Resolve them before deleting your account.',
        409
      )
    }
    const pendingEscrow = await prisma.payment.count({
      where: {
        booking: { artistId: profile.id },
        escrowStatus: { in: ['held', 'awaiting_payment'] },
      },
    })
    if (pendingEscrow > 0) {
      throw new AppError(
        'CONFLICT',
        'You have pending payouts that must clear before deletion.',
        409
      )
    }
    await prisma.user.delete({ where: { id: userId } })
    return { ok: true as const }
  }

  static async updatePersonalInfo(userId: string, input: ArtistPersonalInfoInput) {
    const profile = await getProfileByUser(userId)
    // ArtistProfile owns the canonical first/last name displayed across the
    // platform; we also keep Better Auth's `user.name` in sync so anywhere
    // that reads from the session sees the same name.
    return prisma.$transaction(async (tx) => {
      const updated = await tx.artistProfile.update({
        where: { id: profile.id },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          dob: new Date(input.dob),
          gender: input.gender,
          pronouns: input.pronouns ?? null,
          city: input.city,
          bio: input.bio ?? null,
        },
      })
      await tx.user.update({
        where: { id: userId },
        data: { name: `${input.firstName} ${input.lastName}` },
      })
      return updated
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

  /**
   * Change the artist's craft (model ↔ actor). Only allowed pre-submission —
   * once the application is submitted for review, the type is locked because
   * admins evaluate against type-specific criteria. Switching type wipes the
   * other side's stats and skills (we keep the data isolated so a model
   * switching to actor doesn't surface stale model measurements).
   */
  static async updateArtistType(userId: string, input: UpdateArtistTypeInput) {
    const profile = await getProfileByUser(userId)
    if (profile.submittedAt || profile.approvalStatus === 'approved') {
      throw new AppError('INVALID_STATE', 'Cannot change craft after submitting for review', 400)
    }
    if (profile.artistType === input.artistType) return profile

    return prisma.$transaction(async (tx) => {
      if (input.artistType === 'model') {
        await tx.actorStats.deleteMany({ where: { artistProfileId: profile.id } })
        await tx.artistSkill.deleteMany({ where: { artistProfileId: profile.id } })
      } else {
        await tx.modelStats.deleteMany({ where: { artistProfileId: profile.id } })
      }
      return tx.artistProfile.update({
        where: { id: profile.id },
        data: { artistType: input.artistType },
      })
    })
  }

  /**
   * Replace the artist's full skill list. Used by the actor onboarding step —
   * the UI builds the entire array client-side and PUTs it in one shot, which
   * is simpler than juggling individual add/remove endpoints during onboarding.
   */
  static async replaceSkills(userId: string, input: ReplaceSkillsInput) {
    const profile = await getProfileByUser(userId)
    if (profile.artistType !== 'actor') {
      throw new AppError('INVALID_STATE', 'Skills only apply to actor profiles', 400)
    }
    return prisma.$transaction(async (tx) => {
      await tx.artistSkill.deleteMany({ where: { artistProfileId: profile.id } })
      if (input.skills.length > 0) {
        await tx.artistSkill.createMany({
          data: input.skills.map((s) => ({
            artistProfileId: profile.id,
            skillType: s.skillType,
            skillValue: s.skillValue,
          })),
        })
      }
      return tx.artistSkill.findMany({
        where: { artistProfileId: profile.id },
        orderBy: { skillType: 'asc' },
      })
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
