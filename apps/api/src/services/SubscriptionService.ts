import type Stripe from 'stripe'
import type { SubscriptionStatus } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { stripe } from '../lib/stripe'
import { env } from '../lib/env'
import { AppError } from '../errors'
import { NotificationService } from './NotificationService'

/**
 * Caster platform subscription — the ONLY money CastFlow collects. Job fees
 * are settled directly between caster and artist, off-platform (no escrow, no
 * commission, no artist payouts). One subscription per caster, billed through
 * Stripe Billing + the hosted customer portal.
 *
 * Gating is lazy (no background jobs): a subscription counts as active when
 * its status is `active`/`trialing` AND `currentPeriodEnd` is still in the
 * future — so even a missed `subscription.deleted` webhook can't grant access
 * past the paid period.
 */

const BILLING_PATH = '/caster/settings/billing'

/** Map a Stripe subscription status onto our enum (collapses the variants we
 *  don't model separately). */
function mapStatus(s: Stripe.Subscription.Status): SubscriptionStatus {
  switch (s) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
      return 'past_due'
    case 'unpaid':
      return 'unpaid'
    case 'canceled':
      return 'canceled'
    case 'incomplete':
    case 'incomplete_expired':
      return 'incomplete'
    case 'paused':
      return 'past_due'
    default:
      return 'incomplete'
  }
}

async function getCasterContext(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      casterProfile: { select: { id: true, stripeCustomerId: true, companyName: true } },
    },
  })
  if (!user?.casterProfile) {
    throw new AppError('FORBIDDEN', 'Only casters have a subscription', 403)
  }
  return { email: user.email, name: user.name, caster: user.casterProfile }
}

export class SubscriptionService {
  protected static readonly db = prisma

  /**
   * Ensure the caster has a Stripe Customer and a CasterSubscription shell row,
   * returning the customer id. Idempotent — reuses an existing customer.
   */
  private static async ensureCustomer(userId: string): Promise<{
    casterId: string
    stripeCustomerId: string
  }> {
    const { email, name, caster } = await getCasterContext(userId)
    if (caster.stripeCustomerId) {
      return { casterId: caster.id, stripeCustomerId: caster.stripeCustomerId }
    }

    const customer = await stripe.customers.create({
      email,
      name: caster.companyName || name,
      metadata: { casterProfileId: caster.id },
    })

    await prisma.$transaction(async (tx) => {
      await tx.casterProfile.update({
        where: { id: caster.id },
        data: { stripeCustomerId: customer.id },
      })
      await tx.casterSubscription.upsert({
        where: { casterId: caster.id },
        create: { casterId: caster.id, stripeCustomerId: customer.id, status: 'incomplete' },
        update: { stripeCustomerId: customer.id },
      })
    })

    return { casterId: caster.id, stripeCustomerId: customer.id }
  }

  /** Start a Stripe Checkout session for the caster's subscription. */
  static async createCheckoutSession(userId: string) {
    const { stripeCustomerId } = await SubscriptionService.ensureCustomer(userId)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${env.FRONTEND_URL}${BILLING_PATH}?checkout=success`,
      cancel_url: `${env.FRONTEND_URL}${BILLING_PATH}?checkout=cancelled`,
      allow_promotion_codes: true,
    })
    return { url: session.url }
  }

  /** Open the Stripe-hosted billing portal (update card, cancel, invoices). */
  static async createPortalSession(userId: string) {
    const { caster } = await getCasterContext(userId)
    if (!caster.stripeCustomerId) {
      throw new AppError('NOT_FOUND', 'No billing account yet — subscribe first', 404)
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: caster.stripeCustomerId,
      return_url: `${env.FRONTEND_URL}${BILLING_PATH}`,
    })
    return { url: session.url }
  }

  /** Subscription status for the current caster (null-ish when never started). */
  static async getStatus(userId: string) {
    const { caster } = await getCasterContext(userId)
    const sub = await prisma.casterSubscription.findUnique({ where: { casterId: caster.id } })
    if (!sub) {
      return {
        status: 'none' as const,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        hasCustomer: Boolean(caster.stripeCustomerId),
        isActive: false,
      }
    }
    return {
      status: sub.status,
      priceId: sub.priceId,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      hasCustomer: true,
      isActive: SubscriptionService.computeActive(sub.status, sub.currentPeriodEnd),
    }
  }

  private static computeActive(status: SubscriptionStatus, currentPeriodEnd: Date | null): boolean {
    if (status !== 'active' && status !== 'trialing') return false
    if (currentPeriodEnd && currentPeriodEnd.getTime() <= Date.now()) return false
    return true
  }

  /** Lazy gate check for a caster profile id. */
  static async hasActiveSubscription(casterId: string): Promise<boolean> {
    const sub = await prisma.casterSubscription.findUnique({
      where: { casterId },
      select: { status: true, currentPeriodEnd: true },
    })
    if (!sub) return false
    return SubscriptionService.computeActive(sub.status, sub.currentPeriodEnd)
  }

  /** Throw SUBSCRIPTION_REQUIRED (402) unless the caster has an active sub. */
  static async assertActiveSubscription(casterId: string): Promise<void> {
    if (!(await SubscriptionService.hasActiveSubscription(casterId))) {
      throw new AppError(
        'SUBSCRIPTION_REQUIRED',
        'An active CastFlow subscription is required to post jobs and book talent.',
        402
      )
    }
  }

  // ── Webhook handlers ───────────────────────────────────────────────────────

  /** `checkout.session.completed` — fetch the new subscription and persist. */
  static async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    if (session.mode !== 'subscription' || !session.subscription) return null
    const subscriptionId =
      typeof session.subscription === 'string' ? session.subscription : session.subscription.id
    const sub = await stripe.subscriptions.retrieve(subscriptionId)
    return SubscriptionService.handleSubscriptionUpserted(sub)
  }

  /**
   * `customer.subscription.created|updated|deleted` — upsert our mirror row.
   * Keyed on the Stripe customer id (one subscription per caster).
   */
  static async handleSubscriptionUpserted(sub: Stripe.Subscription) {
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
    const row = await prisma.casterSubscription.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    })
    if (!row) {
      // No mapping — customer wasn't created through our flow. Ignore.
      console.warn('[SubscriptionService] no caster for Stripe customer', { customerId })
      return null
    }

    return prisma.casterSubscription.update({
      where: { id: row.id },
      data: {
        stripeSubscriptionId: sub.id,
        status: mapStatus(sub.status),
        priceId: sub.items.data[0]?.price.id ?? null,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    })
  }

  /** `invoice.payment_failed` — mark past_due and nudge the caster. */
  static async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const customerId =
      typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer?.id ?? null)
    if (!customerId) return null
    const row = await prisma.casterSubscription.findFirst({
      where: { stripeCustomerId: customerId },
      include: { caster: { select: { userId: true } } },
    })
    if (!row) return null

    const updated = await prisma.casterSubscription.update({
      where: { id: row.id },
      data: { status: 'past_due' },
    })

    void NotificationService.notifyEvent({
      userId: row.caster.userId,
      type: 'subscription_past_due',
      title: 'Payment failed for your subscription',
      body: 'We couldn’t charge your card. Update your billing details to keep posting jobs and booking talent.',
      relatedEntityType: 'subscription',
      relatedEntityId: row.id,
      email: { ctaUrl: `${env.FRONTEND_URL}${BILLING_PATH}` },
    })

    return updated
  }
}
