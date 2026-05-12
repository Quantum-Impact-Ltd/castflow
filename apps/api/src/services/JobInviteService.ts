import type { InviteArtistInput } from '@castflow/validators'
import { prisma } from '../lib/prisma'
import { env } from '../lib/env'
import { AppError } from '../errors'
import { NotificationService } from './NotificationService'

/**
 * Caster-to-artist direct invites (PRD §10 — direct invite flow). An invite
 * targets a specific job + artist; on accept the artist can submit a bid even
 * for `invite_only` jobs that don't appear in the public feed.
 *
 * Authz:
 *   - Caster creates invites for their own jobs only.
 *   - Artist accepts/declines invites addressed to their profile only.
 */
async function getCasterProfileId(userId: string): Promise<string> {
  const caster = await prisma.casterProfile.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!caster) throw new AppError('NOT_FOUND', 'Caster profile not found', 404)
  return caster.id
}

async function getArtistProfile(userId: string) {
  const profile = await prisma.artistProfile.findUnique({
    where: { userId },
    select: { id: true, approvalStatus: true, userId: true },
  })
  if (!profile) throw new AppError('NOT_FOUND', 'Artist profile not found', 404)
  if (profile.approvalStatus !== 'approved') {
    throw new AppError('FORBIDDEN', 'Your account must be approved to manage invites', 403)
  }
  return profile
}

export class JobInviteService {
  protected static readonly db = prisma

  static async invite(userId: string, jobId: string, input: InviteArtistInput) {
    const casterId = await getCasterProfileId(userId)

    const job = await prisma.job.findFirst({
      where: { id: jobId, casterId },
      select: {
        id: true,
        title: true,
        status: true,
        applicationDeadline: true,
        headcountRequired: true,
        headcountFilled: true,
      },
    })
    if (!job) throw new AppError('NOT_FOUND', 'Job not found', 404)
    if (job.status !== 'active') {
      throw new AppError('JOB_CLOSED', `Job is ${job.status}`, 410)
    }
    if (new Date() > job.applicationDeadline) {
      throw new AppError('JOB_EXPIRED', 'Application deadline has passed', 410)
    }
    if (job.headcountFilled >= job.headcountRequired) {
      throw new AppError('JOB_FILLED', 'Job is fully booked', 410)
    }

    const artist = await prisma.artistProfile.findUnique({
      where: { id: input.artistId },
      select: { id: true, userId: true, approvalStatus: true, firstName: true },
    })
    if (!artist) throw new AppError('NOT_FOUND', 'Artist not found', 404)
    if (artist.approvalStatus !== 'approved') {
      throw new AppError('INVALID_STATE', 'Cannot invite an artist who is not approved', 400)
    }

    const existing = await prisma.jobInvite.findFirst({
      where: { jobId, artistId: artist.id },
      select: { id: true, status: true },
    })
    if (existing) {
      throw new AppError(
        'INVALID_STATE',
        `An invite for this artist already exists (${existing.status})`,
        409
      )
    }

    const invite = await prisma.jobInvite.create({
      data: {
        jobId,
        artistId: artist.id,
        message: input.message ?? null,
        status: 'pending',
      },
    })

    void NotificationService.notifyEvent({
      userId: artist.userId,
      type: 'invite_received',
      title: `You've been invited to bid`,
      body: `A caster invited you to bid on "${job.title}".${input.message ? ` Note: ${input.message}` : ''}`,
      relatedEntityType: 'job_invite',
      relatedEntityId: invite.id,
      email: { ctaUrl: `${env.FRONTEND_URL}/artist/invites/${invite.id}` },
    })

    return invite
  }

  static async listForArtist(
    userId: string,
    opts: { status?: 'pending' | 'accepted' | 'declined'; cursor?: string; limit?: number } = {}
  ) {
    const artist = await getArtistProfile(userId)
    const take = Math.min(Math.max(opts.limit ?? 25, 1), 100)
    const rows = await prisma.jobInvite.findMany({
      where: { artistId: artist.id, ...(opts.status ? { status: opts.status } : {}) },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
      include: {
        job: {
          select: {
            id: true,
            title: true,
            paymentType: true,
            rateAmount: true,
            shootDate: true,
            applicationDeadline: true,
            status: true,
            caster: { select: { companyName: true } },
          },
        },
      },
    })
    const hasNext = rows.length > take
    const items = hasNext ? rows.slice(0, take) : rows
    return { items, nextCursor: hasNext ? (items.at(-1)?.id ?? null) : null }
  }

  /**
   * Artist views a single invite + the full job detail (including the
   * `invite_only` jobs that don't appear in the public feed).
   *
   * SHOOT-LOCATION RULE: per the non-negotiable in the root CLAUDE.md,
   * `shootLocationDetail` and `callTime` are NEVER returned before the
   * booking's contract is `fully_signed`. An invite is pre-booking, so we
   * strip them out unconditionally here.
   */
  static async getForArtist(userId: string, inviteId: string) {
    const artist = await getArtistProfile(userId)
    const invite = await prisma.jobInvite.findFirst({
      where: { id: inviteId, artistId: artist.id },
      include: {
        job: {
          include: {
            caster: { select: { companyName: true, ratingAvg: true, ratingCount: true } },
          },
        },
      },
    })
    if (!invite) throw new AppError('NOT_FOUND', 'Invite not found', 404)
    return {
      ...invite,
      job: {
        ...invite.job,
        shootLocationDetail: null,
        callTime: null,
      },
    }
  }

  static async accept(userId: string, inviteId: string) {
    return JobInviteService.transitionInvite(userId, inviteId, 'accepted')
  }

  static async decline(userId: string, inviteId: string) {
    return JobInviteService.transitionInvite(userId, inviteId, 'declined')
  }

  private static async transitionInvite(
    userId: string,
    inviteId: string,
    target: 'accepted' | 'declined'
  ) {
    const artist = await getArtistProfile(userId)
    const invite = await prisma.jobInvite.findUnique({
      where: { id: inviteId },
      include: {
        job: { select: { id: true, title: true, caster: { select: { userId: true } } } },
      },
    })
    if (!invite) throw new AppError('NOT_FOUND', 'Invite not found', 404)
    if (invite.artistId !== artist.id) {
      throw new AppError('FORBIDDEN', 'Not your invite', 403)
    }
    if (invite.status !== 'pending') {
      throw new AppError('INVALID_STATE', `Invite already ${invite.status}`, 400)
    }

    const updated = await prisma.jobInvite.update({
      where: { id: inviteId },
      data: { status: target },
    })

    void NotificationService.notifyEvent({
      userId: invite.job.caster.userId,
      type: target === 'accepted' ? 'invite_accepted' : 'invite_declined',
      title: target === 'accepted' ? 'Invite accepted' : 'Invite declined',
      body:
        target === 'accepted'
          ? `An invited artist accepted your invite to bid on "${invite.job.title}".`
          : `An invited artist declined your invite to bid on "${invite.job.title}".`,
      relatedEntityType: 'job_invite',
      relatedEntityId: invite.id,
      email: { ctaUrl: `${env.FRONTEND_URL}/caster/jobs/${invite.job.id}/invites` },
    })

    return updated
  }
}
