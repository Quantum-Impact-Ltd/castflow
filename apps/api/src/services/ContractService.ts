import { PutObjectCommand } from '@aws-sdk/client-s3'
import { prisma } from '../lib/prisma'
import { env } from '../lib/env'
import { r2, Buckets } from '../lib/r2'
import { AppError } from '../errors'
import { renderContractPdf } from '../templates/contract-pdf'
import { NotificationService } from './NotificationService'

interface UserCtx {
  id: string
  role: 'admin' | 'caster' | 'artist'
}

function paymentTerms(args: {
  paymentType: 'fixed' | 'hourly'
  agreedRate: number
  agreedHours: number | null
  totalAmount: number
}): string {
  if (args.paymentType === 'hourly' && args.agreedHours) {
    return `£${args.agreedRate}/hr × ${args.agreedHours} hours = £${args.totalAmount}`
  }
  return `£${args.totalAmount} flat fee`
}

async function loadBookingForContract(bookingId: string, user: UserCtx) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      caster: { select: { userId: true, companyName: true } },
      artist: { select: { userId: true, firstName: true, lastName: true } },
      job: { select: { title: true, usageRights: true, exclusivity: true, requiresNda: true } },
      contract: true,
    },
  })
  if (!booking) throw new AppError('NOT_FOUND', 'Booking not found', 404)
  if (user.role !== 'admin') {
    const isOwner =
      (user.role === 'caster' && booking.caster.userId === user.id) ||
      (user.role === 'artist' && booking.artist.userId === user.id)
    if (!isOwner) throw new AppError('FORBIDDEN', 'Not your booking', 403)
  }
  return booking
}

export class ContractService {
  protected static readonly db = prisma

  /**
   * Generate the contract once payment is held. Idempotent — returns the
   * existing contract if already generated.
   */
  static async generateForBooking(user: UserCtx, bookingId: string) {
    const booking = await loadBookingForContract(bookingId, user)
    if (booking.contract) return booking.contract

    const data = {
      bookingId: booking.id,
      status: 'pending_signatures' as const,
      artistLegalName: `${booking.artist.firstName} ${booking.artist.lastName}`,
      casterCompanyName: booking.caster.companyName,
      jobTitle: booking.job.title,
      shootDate: booking.shootDate,
      shootLocation: booking.shootLocation,
      paymentType: booking.paymentType,
      agreedRate: booking.agreedRate,
      agreedHours: booking.agreedHours,
      totalAmount: booking.totalAmount,
      paymentTerms: paymentTerms({
        paymentType: booking.paymentType,
        agreedRate: Number(booking.agreedRate),
        agreedHours: booking.agreedHours ? Number(booking.agreedHours) : null,
        totalAmount: Number(booking.totalAmount),
      }),
      usageRights: booking.job.usageRights,
      exclusivity: booking.job.exclusivity,
      ndaIncluded: booking.job.requiresNda,
    }

    const contract = await prisma.contract.create({ data })

    const partyCtx = [
      { userId: booking.caster.userId, label: booking.caster.companyName },
      {
        userId: booking.artist.userId,
        label: `${booking.artist.firstName} ${booking.artist.lastName}`,
      },
    ]
    for (const p of partyCtx) {
      void NotificationService.notifyEvent({
        userId: p.userId,
        type: 'contract_ready',
        title: 'Contract ready to sign',
        body: `The contract for "${booking.job.title}" is ready. Both parties must sign within 72 hours.`,
        relatedEntityType: 'contract',
        relatedEntityId: contract.id,
        email: { ctaUrl: `${env.FRONTEND_URL}/bookings/${booking.id}/contract` },
      })
    }

    return contract
  }

  /**
   * Render the fully-signed contract to PDF, upload to the contracts R2
   * bucket, and persist the URL on the Contract row. Idempotent: returns
   * the existing pdfUrl if already rendered.
   */
  static async persistPdf(contractId: string): Promise<string> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { booking: { select: { id: true } } },
    })
    if (!contract) throw new AppError('NOT_FOUND', 'Contract not found', 404)
    if (contract.status !== 'fully_signed') {
      throw new AppError('INVALID_STATE', 'Contract is not fully signed', 400)
    }
    if (contract.pdfUrl) return contract.pdfUrl

    const buffer = await renderContractPdf({
      contractId: contract.id,
      jobTitle: contract.jobTitle,
      artistLegalName: contract.artistLegalName,
      casterCompanyName: contract.casterCompanyName,
      shootDate: contract.shootDate,
      shootLocation: contract.shootLocation,
      paymentTerms: contract.paymentTerms,
      usageRights: contract.usageRights,
      exclusivity: contract.exclusivity,
      ndaIncluded: contract.ndaIncluded,
      artistSignatureStr: contract.artistSignatureStr,
      artistSignedAt: contract.artistSignedAt,
      casterSignatureStr: contract.casterSignatureStr,
      casterSignedAt: contract.casterSignedAt,
    })

    const key = `contracts/${contract.bookingId}/${contract.id}.pdf`
    await r2.send(
      new PutObjectCommand({
        Bucket: Buckets.contracts,
        Key: key,
        Body: buffer,
        ContentType: 'application/pdf',
      })
    )

    // We store the R2 object key, not a fully qualified URL — the contracts
    // bucket is private; reads go through a presigned-URL endpoint per
    // request. Store as `s3://<bucket>/<key>` for clarity.
    const pdfUrl = `s3://${Buckets.contracts}/${key}`
    await prisma.contract.update({
      where: { id: contract.id },
      data: { pdfUrl },
    })
    return pdfUrl
  }

  static async getForBooking(user: UserCtx, bookingId: string) {
    const booking = await loadBookingForContract(bookingId, user)
    if (!booking.contract) {
      throw new AppError('NOT_FOUND', 'Contract not yet generated', 404)
    }
    return booking.contract
  }

  /**
   * Sign as the calling party. Once both parties sign, status → fully_signed.
   */
  static async sign(user: UserCtx, bookingId: string, signatureName: string) {
    if (!signatureName || signatureName.trim().length < 2) {
      throw new AppError('VALIDATION_ERROR', 'Signature name is required', 400, {
        signatureName: ['Must be at least 2 characters'],
      })
    }
    const booking = await loadBookingForContract(bookingId, user)
    if (!booking.contract) throw new AppError('NOT_FOUND', 'Contract not yet generated', 404)
    const contract = booking.contract

    if (contract.status === 'voided') {
      throw new AppError('INVALID_STATE', 'Contract is voided', 400)
    }

    // PRD §10.7 — contract must be signed within 72h of generation.
    const signingDeadline = new Date(contract.createdAt)
    signingDeadline.setHours(signingDeadline.getHours() + 72)
    if (new Date() > signingDeadline) {
      throw new AppError(
        'INVALID_STATE',
        'Signing window has closed — contract must be signed within 72 hours of generation',
        400
      )
    }

    const isArtist = user.role === 'artist'
    const isCaster = user.role === 'caster'
    if (!isArtist && !isCaster) {
      throw new AppError('FORBIDDEN', 'Only the contract parties may sign', 403)
    }
    if (isArtist && contract.artistSigned) {
      throw new AppError('CONTRACT_ALREADY_SIGNED', 'Already signed by artist', 400)
    }
    if (isCaster && contract.casterSigned) {
      throw new AppError('CONTRACT_ALREADY_SIGNED', 'Already signed by caster', 400)
    }

    const now = new Date()
    const artistSigned = isArtist ? true : contract.artistSigned
    const casterSigned = isCaster ? true : contract.casterSigned
    const bothSigned = artistSigned && casterSigned

    const updated = await prisma.contract.update({
      where: { id: contract.id },
      data: {
        artistSigned,
        casterSigned,
        artistSignedAt: isArtist ? now : contract.artistSignedAt,
        artistSignatureStr: isArtist ? signatureName : contract.artistSignatureStr,
        casterSignedAt: isCaster ? now : contract.casterSignedAt,
        casterSignatureStr: isCaster ? signatureName : contract.casterSignatureStr,
        status: bothSigned ? 'fully_signed' : 'partially_signed',
      },
    })

    const ctaUrl = `${env.FRONTEND_URL}/bookings/${booking.id}/contract`
    if (bothSigned) {
      // Fire-and-forget PDF render + upload. We don't block the signing
      // response on PDF generation because react-pdf can be slow on big
      // contracts; if it fails we log and the contract row simply lacks
      // a pdfUrl until the next sign-or-fetch path can retry it.
      void ContractService.persistPdf(contract.id).catch((err: unknown) => {
        console.error('[ContractService] PDF render/upload failed', {
          contractId: contract.id,
          error: err instanceof Error ? err.message : String(err),
        })
      })
      // Notify both parties — contract is now binding and shoot details unlock.
      for (const userId of [booking.caster.userId, booking.artist.userId]) {
        void NotificationService.notifyEvent({
          userId,
          type: 'contract_fully_signed',
          title: 'Contract fully signed',
          body: `Both parties have signed the contract for "${booking.job.title}". Shoot location and call time are now visible.`,
          relatedEntityType: 'contract',
          relatedEntityId: contract.id,
          email: { ctaUrl },
        })
      }
    } else {
      // Only one party has signed — ping the other.
      const otherUserId = isArtist ? booking.caster.userId : booking.artist.userId
      void NotificationService.notifyEvent({
        userId: otherUserId,
        type: 'contract_signed_by_other',
        title: 'Your contract counterpart signed',
        body: `${isArtist ? 'The artist' : 'The caster'} signed the contract for "${booking.job.title}". Sign within 72 hours to lock it in.`,
        relatedEntityType: 'contract',
        relatedEntityId: contract.id,
        email: { ctaUrl },
      })
    }

    return updated
  }
}
