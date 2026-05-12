import { prisma } from '../lib/prisma'
import { stripe } from '../lib/stripe'
import { env } from '../lib/env'
import { AppError } from '../errors'
import { NotificationService } from './NotificationService'

/**
 * Money utilities — Stripe expects integer pence/cents (smallest unit).
 * Database keeps Decimal in major-unit GBP for human readability.
 */
function toMinor(amount: number): number {
  return Math.round(amount * 100)
}

function computeCommission(gross: number) {
  const rate = env.PLATFORM_COMMISSION_RATE
  const commission = Math.round(gross * rate) / 100
  const net = Math.round((gross - commission) * 100) / 100
  return { commission, net, rate }
}

function autoReleaseAt(shootDate: Date): Date {
  // Auto-release escrow 48h after shoot date if caster hasn't confirmed.
  const d = new Date(shootDate)
  d.setHours(d.getHours() + 48)
  return d
}

/**
 * Stripe Connect Express onboarding for artist payouts. We use the
 * separate-charges-and-transfers model: caster charges go to the platform
 * (escrow), and on release we create a Transfer to the artist's connected
 * account. Express accounts give Stripe-hosted onboarding/verification UX.
 */
async function ensureConnectAccountForArtist(args: {
  artistProfileId: string
  email: string
}): Promise<{ accountId: string; payoutsEnabled: boolean }> {
  const profile = await prisma.artistProfile.findUnique({
    where: { id: args.artistProfileId },
    select: { id: true, stripeAccountId: true, payoutsEnabled: true },
  })
  if (!profile) throw new AppError('NOT_FOUND', 'Artist profile not found', 404)

  if (profile.stripeAccountId) {
    return { accountId: profile.stripeAccountId, payoutsEnabled: profile.payoutsEnabled }
  }

  const account = await stripe.accounts.create({
    type: 'express',
    country: 'GB',
    email: args.email,
    capabilities: {
      transfers: { requested: true },
    },
    business_type: 'individual',
    metadata: { artistProfileId: args.artistProfileId },
  })

  await prisma.artistProfile.update({
    where: { id: args.artistProfileId },
    data: { stripeAccountId: account.id, payoutsEnabled: false },
  })
  return { accountId: account.id, payoutsEnabled: false }
}

export class PaymentService {
  protected static readonly db = prisma

  // ── Stripe Connect (artist payouts) ───────────────────────────────────────

  /**
   * Create (idempotently) a Stripe Connect Express account for the artist and
   * return a one-time onboarding link. Frontend redirects the artist to
   * `url`; Stripe handles ID verification, bank details, and ToS acceptance,
   * then redirects back to `returnUrl` (or `refreshUrl` if the link expired).
   */
  static async createConnectOnboardingLink(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        artistProfile: { select: { id: true } },
      },
    })
    if (!user?.artistProfile) {
      throw new AppError('FORBIDDEN', 'Only artists can onboard for payouts', 403)
    }

    const { accountId } = await ensureConnectAccountForArtist({
      artistProfileId: user.artistProfile.id,
      email: user.email,
    })

    const link = await stripe.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      refresh_url: `${env.FRONTEND_URL}/artist/payouts/setup?refresh=1`,
      return_url: `${env.FRONTEND_URL}/artist/payouts/setup?completed=1`,
    })
    return { url: link.url, expiresAt: new Date(link.expires_at * 1000) }
  }

  /**
   * Live status read for the artist's Connect account. Reconciles the cached
   * `payoutsEnabled` if it has drifted from Stripe (which is the source of
   * truth — webhooks can lag or be missed entirely in dev).
   */
  static async getConnectStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        artistProfile: {
          select: {
            id: true,
            stripeAccountId: true,
            payoutsEnabled: true,
          },
        },
      },
    })
    if (!user?.artistProfile) {
      throw new AppError('FORBIDDEN', 'Only artists have a payout account', 403)
    }
    const profile = user.artistProfile
    if (!profile.stripeAccountId) {
      return {
        connected: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        requirementsDue: [] as string[],
      }
    }

    const account = await stripe.accounts.retrieve(profile.stripeAccountId)
    const payoutsEnabled = account.payouts_enabled ?? false
    const detailsSubmitted = account.details_submitted ?? false
    const requirementsDue = account.requirements?.currently_due ?? []

    if (payoutsEnabled !== profile.payoutsEnabled) {
      await prisma.artistProfile.update({
        where: { id: profile.id },
        data: { payoutsEnabled },
      })
    }
    return {
      connected: true,
      accountId: profile.stripeAccountId,
      payoutsEnabled,
      detailsSubmitted,
      requirementsDue,
    }
  }

  /**
   * Webhook: `account.application.deauthorized`. The artist revoked the
   * platform's access from their Stripe dashboard. Clear our cached
   * account binding so future `releaseEscrow` / `partialRelease` calls
   * throw `PAYOUT_NOT_READY` and surface to admin instead of attempting
   * a transfer to an account that would 401.
   */
  static async clearConnectAccount(accountId: string) {
    const profile = await prisma.artistProfile.findFirst({
      where: { stripeAccountId: accountId },
      select: { id: true },
    })
    if (!profile) return null
    return prisma.artistProfile.update({
      where: { id: profile.id },
      data: { stripeAccountId: null, payoutsEnabled: false },
    })
  }

  /**
   * Webhook: `account.updated`. Mirror Stripe's `payouts_enabled` flag onto
   * the cached column so `releaseEscrow` can gate without an RPC.
   */
  static async syncConnectAccountStatus(account: { id: string; payouts_enabled: boolean | null }) {
    const profile = await prisma.artistProfile.findFirst({
      where: { stripeAccountId: account.id },
      select: { id: true },
    })
    if (!profile) return null
    return prisma.artistProfile.update({
      where: { id: profile.id },
      data: { payoutsEnabled: account.payouts_enabled ?? false },
    })
  }

  /**
   * Caster initiates escrow payment for a confirmed booking.
   * Creates a Stripe PaymentIntent + a Payment row in awaiting_payment state.
   * The client then confirms the intent in the browser using stripe.js.
   */
  static async createEscrowIntent(userId: string, bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        caster: { select: { id: true, userId: true, stripeCustomerId: true } },
        payment: true,
      },
    })
    if (!booking) throw new AppError('NOT_FOUND', 'Booking not found', 404)
    if (booking.caster.userId !== userId) {
      throw new AppError('FORBIDDEN', 'Not your booking', 403)
    }
    if (booking.status !== 'pending_payment') {
      throw new AppError('INVALID_STATE', `Booking is ${booking.status}`, 400)
    }
    if (booking.payment && booking.payment.escrowStatus !== 'awaiting_payment') {
      throw new AppError('INVALID_STATE', `Payment already in ${booking.payment.escrowStatus}`, 400)
    }

    const gross = Number(booking.totalAmount)
    const { commission, net, rate } = computeCommission(gross)

    // Idempotency key scoped to the booking — retries from a flaky client
    // return the same PaymentIntent instead of authorising twice and leaving
    // an orphan hold. Suffixed with the existing intent id if any, so a fresh
    // attempt after explicit cancellation gets a new key.
    const idempotencyKey = booking.payment?.stripePaymentIntentId
      ? `booking-${booking.id}-retry-${booking.payment.stripePaymentIntentId}`
      : `booking-${booking.id}-intent`

    const intent = await stripe.paymentIntents.create(
      {
        amount: toMinor(gross),
        currency: 'gbp',
        capture_method: 'manual',
        metadata: {
          bookingId: booking.id,
          casterUserId: booking.caster.userId,
          artistProfileId: booking.artistId,
        },
      },
      { idempotencyKey }
    )

    if (booking.payment) {
      return prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          stripePaymentIntentId: intent.id,
          grossAmount: gross,
          platformCommissionRate: rate,
          platformCommissionAmount: commission,
          netArtistAmount: net,
          autoReleaseAt: autoReleaseAt(booking.shootDate),
        },
      })
    }

    return prisma.payment.create({
      data: {
        bookingId: booking.id,
        stripePaymentIntentId: intent.id,
        grossAmount: gross,
        platformCommissionRate: rate,
        platformCommissionAmount: commission,
        netArtistAmount: net,
        escrowStatus: 'awaiting_payment',
        autoReleaseAt: autoReleaseAt(booking.shootDate),
      },
    })
  }

  /**
   * Called by Stripe webhook on `payment_intent.succeeded` (after auth).
   * Idempotent — if payment already 'held', returns silently.
   */
  static async markEscrowHeld(stripePaymentIntentId: string, chargeId: string | null) {
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentIntentId },
      include: {
        booking: {
          select: {
            id: true,
            job: { select: { title: true } },
            artist: { select: { userId: true } },
            caster: { select: { userId: true } },
          },
        },
      },
    })
    if (!payment) return null
    if (payment.escrowStatus === 'held') return payment

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.payment.update({
        where: { id: payment.id },
        data: {
          escrowStatus: 'held',
          stripeChargeId: chargeId,
          paidAt: new Date(),
        },
      })
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'confirmed' },
      })
      return row
    })

    // Both parties want to know — caster to know their card was charged into
    // escrow, artist to know money is locked and the contract step is next.
    const title = `Payment held for "${payment.booking.job.title}"`
    const body = `Caster funds are in escrow. The contract is being generated for both parties to sign.`
    const ctaUrl = `${env.FRONTEND_URL}/bookings/${payment.booking.id}`
    for (const userId of [payment.booking.caster.userId, payment.booking.artist.userId]) {
      void NotificationService.notifyEvent({
        userId,
        type: 'payment_held',
        title,
        body,
        relatedEntityType: 'payment',
        relatedEntityId: payment.id,
        email: { ctaUrl },
      })
    }

    return updated
  }

  /**
   * Manual release by caster after shoot confirmation,
   * or lazy auto-release when read after autoReleaseAt.
   *
   * Gating: the artist must have an active Connect account with
   * `payouts_enabled: true` before we capture. If they don't, we throw
   * `PAYOUT_NOT_READY` and leave the escrow `held` — no orphan capture, no
   * money stuck on the platform. The caller (manual confirm or
   * `maybeAutoRelease`) decides whether to surface, notify, or retry later.
   */
  static async releaseEscrow(bookingId: string, opts: { actor: 'caster' | 'auto' | 'admin' }) {
    const payment = await prisma.payment.findUnique({
      where: { bookingId },
      include: {
        booking: {
          include: {
            artist: { select: { id: true, stripeAccountId: true, payoutsEnabled: true } },
          },
        },
      },
    })
    if (!payment) throw new AppError('NOT_FOUND', 'Payment not found', 404)
    if (payment.escrowStatus === 'released') return payment
    if (payment.escrowStatus !== 'held') {
      throw new AppError('INVALID_STATE', `Cannot release from ${payment.escrowStatus}`, 400)
    }

    const artist = payment.booking.artist
    if (!artist.stripeAccountId || !artist.payoutsEnabled) {
      throw new AppError(
        'PAYOUT_NOT_READY',
        'Artist has not completed payout setup — escrow remains held until they do',
        409
      )
    }

    // Capture the auth hold (money moves from caster's card → platform).
    // Idempotent on Stripe's side: capturing an already-captured intent throws,
    // but our escrowStatus guard above prevents that.
    await stripe.paymentIntents.capture(payment.stripePaymentIntentId, undefined, {
      idempotencyKey: `capture-${payment.id}`,
    })

    // Transfer the net artist amount from the platform balance to the
    // connected account. `source_transaction` links the transfer to the
    // original charge so Stripe Connect reports tie out correctly.
    const transfer = await stripe.transfers.create(
      {
        amount: toMinor(Number(payment.netArtistAmount)),
        currency: 'gbp',
        destination: artist.stripeAccountId,
        ...(payment.stripeChargeId ? { source_transaction: payment.stripeChargeId } : {}),
        metadata: {
          bookingId: payment.bookingId,
          paymentId: payment.id,
          artistProfileId: artist.id,
        },
      },
      { idempotencyKey: `transfer-${payment.id}` }
    )

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.payment.update({
        where: { id: payment.id },
        data: {
          escrowStatus: 'released',
          releasedAt: new Date(),
          stripeTransferId: transfer.id,
        },
      })
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: 'completed',
          ...(opts.actor === 'caster' ? { completionConfirmedAt: new Date() } : {}),
        },
      })
      return row
    })

    // Notify the artist that funds are on the way (combining payment_released
    // + payout_sent into a single user-facing event — they're indistinguishable
    // to the artist now that Connect is in the loop).
    const artistUserId = await prisma.user.findFirst({
      where: { artistProfile: { id: payment.booking.artistId } },
      select: { id: true },
    })
    if (artistUserId) {
      void NotificationService.notifyEvent({
        userId: artistUserId.id,
        type: 'payout_sent',
        title: 'Payout on its way',
        body: `£${Number(payment.netArtistAmount).toFixed(2)} has been released from escrow and transferred to your Stripe account.`,
        relatedEntityType: 'payment',
        relatedEntityId: payment.id,
        email: { ctaUrl: `${env.FRONTEND_URL}/artist/earnings` },
      })
    }

    return updated
  }

  /**
   * Partial release: capture `capturePct%` of the gross authorization (the
   * remainder auto-releases back to the caster), then transfer the
   * commission-adjusted net to the artist's Connect account. Used by:
   *
   *   - BookingService.cancel under-48h tier (capturePct=50, "cancellation fee")
   *   - DisputeService.adminResolve with resolution='split'
   *
   * `escrowStatus` → 'partially_refunded' and `Booking.status` → 'cancelled'
   * (since partial release only happens on cancel/dispute, never completion).
   *
   * If the artist hasn't completed Connect onboarding, this throws
   * `PAYOUT_NOT_READY`. Callers that need to proceed regardless (cancellation
   * flow) catch and fall back to a full refund + retained
   * `cancellationFeeAmount` for admin reconciliation.
   */
  static async partialRelease(
    bookingId: string,
    capturePct: number,
    opts: { reason?: string; resolution?: 'split' | 'cancellation_fee' } = {}
  ) {
    if (capturePct <= 0 || capturePct >= 100) {
      throw new AppError(
        'INVALID_STATE',
        `Partial release requires 0 < capturePct < 100, got ${capturePct}`,
        400
      )
    }

    const payment = await prisma.payment.findUnique({
      where: { bookingId },
      include: {
        booking: {
          include: {
            artist: { select: { id: true, stripeAccountId: true, payoutsEnabled: true } },
          },
        },
      },
    })
    if (!payment) throw new AppError('NOT_FOUND', 'Payment not found', 404)
    if (payment.escrowStatus !== 'held') {
      throw new AppError(
        'INVALID_STATE',
        `Cannot partially release from ${payment.escrowStatus}`,
        400
      )
    }

    const artist = payment.booking.artist
    if (!artist.stripeAccountId || !artist.payoutsEnabled) {
      throw new AppError(
        'PAYOUT_NOT_READY',
        'Artist has not completed payout setup — partial release blocked',
        409
      )
    }

    const grossPence = toMinor(Number(payment.grossAmount))
    const captureGrossPence = Math.round((grossPence * capturePct) / 100)
    const commissionRate = Number(payment.platformCommissionRate)
    const commissionPence = Math.round((captureGrossPence * commissionRate) / 100)
    const artistNetPence = captureGrossPence - commissionPence

    // Capture only the partial amount. The remainder of the authorisation
    // is released automatically by Stripe.
    await stripe.paymentIntents.capture(payment.stripePaymentIntentId, {
      amount_to_capture: captureGrossPence,
    })

    const transfer = await stripe.transfers.create(
      {
        amount: artistNetPence,
        currency: 'gbp',
        destination: artist.stripeAccountId,
        ...(payment.stripeChargeId ? { source_transaction: payment.stripeChargeId } : {}),
        metadata: {
          bookingId: payment.bookingId,
          paymentId: payment.id,
          artistProfileId: artist.id,
          resolution: opts.resolution ?? 'split',
          capturePct: String(capturePct),
        },
      },
      { idempotencyKey: `partial-transfer-${payment.id}-${capturePct}` }
    )

    return prisma.$transaction(async (tx) => {
      const row = await tx.payment.update({
        where: { id: payment.id },
        data: {
          escrowStatus: 'partially_refunded',
          releasedAt: new Date(),
          stripeTransferId: transfer.id,
          ...(opts.resolution === 'cancellation_fee'
            ? { cancellationFeeAmount: captureGrossPence / 100 }
            : {}),
        },
      })
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: 'cancelled',
          ...(opts.reason ? { cancellationReason: opts.reason } : {}),
        },
      })
      return row
    })
  }

  static async refundEscrow(bookingId: string, reason: string) {
    const payment = await prisma.payment.findUnique({
      where: { bookingId },
    })
    if (!payment) throw new AppError('NOT_FOUND', 'Payment not found', 404)
    if (payment.escrowStatus === 'refunded') return payment
    if (payment.escrowStatus !== 'held') {
      throw new AppError('INVALID_STATE', `Cannot refund from ${payment.escrowStatus}`, 400)
    }

    await stripe.paymentIntents.cancel(payment.stripePaymentIntentId, {
      cancellation_reason: 'requested_by_customer',
    })

    return prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: {
          escrowStatus: 'refunded',
          refundedAt: new Date(),
        },
      })
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'cancelled', cancellationReason: reason },
      })
      return updated
    })
  }

  /**
   * Webhook: `charge.refunded`. Stripe processed a refund (full or partial),
   * possibly initiated from the Stripe dashboard. Reconcile the DB.
   */
  static async markRefundedByCharge(stripeChargeId: string, fullyRefunded: boolean) {
    const payment = await prisma.payment.findFirst({ where: { stripeChargeId } })
    if (!payment) return null
    if (payment.escrowStatus === 'refunded') return payment
    const nextStatus = fullyRefunded ? 'refunded' : 'partially_refunded'
    return prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: {
          escrowStatus: nextStatus,
          refundedAt: fullyRefunded ? new Date() : payment.refundedAt,
        },
      })
      if (fullyRefunded) {
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'cancelled' },
        })
      }
      return updated
    })
  }

  /**
   * Webhook: `payment_intent.canceled`. Stripe released the auth hold.
   * Match what `refundEscrow` does in DB, idempotently.
   */
  static async markCanceledByIntent(stripePaymentIntentId: string) {
    const payment = await prisma.payment.findUnique({ where: { stripePaymentIntentId } })
    if (!payment) return null
    if (payment.escrowStatus === 'refunded') return payment
    if (payment.escrowStatus === 'released') return payment
    return prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: { escrowStatus: 'refunded', refundedAt: new Date() },
      })
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'cancelled' },
      })
      return updated
    })
  }

  /**
   * Webhook: `charge.dispute.created`. A cardholder filed a chargeback on the
   * Stripe charge. Flag payment + booking as disputed so admin can intervene.
   * Note: this is a Stripe-side dispute (chargeback), distinct from the
   * platform Dispute model raised between caster and artist.
   */
  static async markDisputedByCharge(stripeChargeId: string) {
    const payment = await prisma.payment.findFirst({ where: { stripeChargeId } })
    if (!payment) return null
    if (payment.escrowStatus === 'disputed') return payment
    return prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: { escrowStatus: 'disputed' },
      })
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'disputed' },
      })
      return updated
    })
  }

  /**
   * Lazy auto-release — call this on any read of payment that might be due.
   * Swallows `PAYOUT_NOT_READY` so a not-yet-onboarded artist doesn't make
   * every booking detail read 4xx; the escrow stays `held` until the artist
   * finishes payout setup and the next read triggers the release.
   */
  static async maybeAutoRelease(bookingId: string) {
    const payment = await prisma.payment.findUnique({ where: { bookingId } })
    if (!payment) return null
    if (payment.escrowStatus === 'held' && new Date() > payment.autoReleaseAt) {
      try {
        return await PaymentService.releaseEscrow(bookingId, { actor: 'auto' })
      } catch (err) {
        if (err instanceof AppError && err.code === 'PAYOUT_NOT_READY') {
          // Expected — artist hasn't onboarded. Surface in logs so ops sees
          // ageing escrows but don't poison the booking read.
          console.warn('[PaymentService] auto-release deferred (PAYOUT_NOT_READY)', {
            bookingId,
          })
          return payment
        }
        throw err
      }
    }
    return payment
  }
}
