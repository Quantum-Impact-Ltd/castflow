# CastFlow API — Claude Code Instructions

## Stack

- **Runtime:** Bun
- **Framework:** Hono
- **ORM:** Prisma (PostgreSQL)
- **Auth:** Better Auth
- **Payments:** Stripe Billing (caster subscriptions only)
- **Email:** Resend
- **Storage:** Cloudflare R2 (S3-compatible via @aws-sdk/client-s3)
- **WebSockets:** Hono native (`createBunWebSocket`)

## Directory Structure

```
apps/api/
├── src/
│   ├── index.ts              # Entry point — Bun.serve with Hono + websocket
│   ├── lib/
│   │   ├── auth.ts           # Better Auth instance
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── stripe.ts         # Stripe client singleton
│   │   ├── resend.ts         # Resend client singleton
│   │   ├── r2.ts             # R2/S3 client
│   │   └── env.ts            # Zod-validated env vars (crash on missing)
│   ├── middleware/
│   │   ├── authenticate.ts   # JWT/session middleware — attaches user to context
│   │   ├── requireRole.ts    # Role guard factory
│   │   └── requireOwner.ts   # Resource ownership guard
│   ├── routes/
│   │   ├── auth.ts           # Better Auth handler mount
│   │   ├── artists.ts
│   │   ├── casters.ts
│   │   ├── jobs.ts
│   │   ├── bids.ts
│   │   ├── bookings.ts
│   │   ├── contracts.ts
│   │   ├── subscriptions.ts
│   │   ├── messages.ts
│   │   ├── reviews.ts
│   │   ├── disputes.ts
│   │   ├── notifications.ts
│   │   ├── uploads.ts
│   │   ├── talent.ts         # Talent search
│   │   ├── webhooks.ts       # Stripe webhook
│   │   └── admin/
│   │       ├── users.ts
│   │       ├── applications.ts
│   │       ├── jobs.ts
│   │       ├── bookings.ts
│   │       ├── disputes.ts
│   │       ├── flagged.ts
│   │       ├── analytics.ts
│   │       └── logs.ts
│   ├── services/             # All business logic lives here, NOT in routes
│   │   ├── ArtistService.ts
│   │   ├── BidService.ts
│   │   ├── BookingService.ts
│   │   ├── ContractService.ts
│   │   ├── SubscriptionService.ts
│   │   ├── DisputeService.ts
│   │   ├── NotificationService.ts
│   │   ├── EmailService.ts
│   │   └── UploadService.ts
│   ├── errors/
│   │   ├── AppError.ts       # Custom error class
│   │   └── ErrorCodes.ts     # All error codes as constants
│   └── ws/
│       └── messaging.ts      # WebSocket room management for messaging
├── prisma/
│   └── schema.prisma
└── CLAUDE.md                 # This file
```

## Response Shape — ALWAYS Use This

Every response, success or failure, uses this shape:

```typescript
// Success
{ success: true, data: T, meta?: { total, page, limit, hasNext } }

// Error
{ success: false, error: { code: string, message: string, fields?: Record<string, string[]> } }
```

Never return raw data without wrapping it. Never return different shapes from different endpoints.

## Error Handling Pattern

```typescript
// AppError is thrown anywhere in service code
throw new AppError('DUPLICATE_BID', 'You have already bid on this job', 409)

// Global error handler in index.ts catches it and formats the response
// NEVER let raw errors escape to the client
// NEVER expose stack traces in production
```

All error codes are defined in `src/errors/ErrorCodes.ts`. Add new ones there, never inline strings.

## Route → Service Pattern (CRITICAL)

Routes handle HTTP only. Business logic always lives in services.

```typescript
// ✅ CORRECT
app.post('/jobs/:id/bids', authenticate, async (c) => {
  const bid = await BidService.submitBid({
    jobId: c.req.param('id'),
    artistId: c.var.user.profileId,
    ...c.req.valid('json')
  })
  return c.json({ success: true, data: bid })
})

// ❌ WRONG — business logic in route handler
app.post('/jobs/:id/bids', authenticate, async (c) => {
  const existing = await prisma.bid.findFirst(...)
  if (existing) return c.json({ error: '...' }, 409)
  const bid = await prisma.bid.create(...)
  await sendEmail(...)
  return c.json({ success: true, data: bid })
})
```

## Database Transactions — Required for Multi-Step Operations

Any operation that touches more than one table must use a transaction:

```typescript
// Example: accepting a bid creates a booking and updates multiple records
await prisma.$transaction(async (tx) => {
  await tx.bid.update({ where: { id: bidId }, data: { status: 'accepted' } })
  const booking = await tx.booking.create({ data: { ... } })
  if (jobNowFilled) {
    await tx.bid.updateMany({ where: { jobId, status: 'pending' }, data: { status: 'expired' } })
    await tx.job.update({ where: { id: jobId }, data: { status: 'filled' } })
  }
  return booking
})
```

## Validation — Every Endpoint

Import schemas from `@castflow/validators`. Validate before any service call.

```typescript
import { submitBidSchema } from '@castflow/validators'

const result = submitBidSchema.safeParse(await c.req.json())
if (!result.success) {
  throw new AppError('VALIDATION_ERROR', 'Invalid input', 400, result.error.flatten().fieldErrors)
}
```

## Auth Context

Better Auth session middleware attaches the user to context. Access via `c.var.user`.

```typescript
// User context shape on every authenticated request
interface UserContext {
  id: string // User.id
  role: 'admin' | 'caster' | 'artist'
  profileId: string // ArtistProfile.id or CasterProfile.id
  approvalStatus?: 'pending' | 'approved' | 'rejected' // artists only
}
```

## Middleware Usage

```typescript
// Protect a route
app.get('/jobs', authenticate, handler)

// Role guard
app.get('/admin/users', authenticate, requireRole('admin'), handler)

// Ownership check (artist accessing own bids)
app.get('/artists/me/bids', authenticate, requireRole('artist'), handler)
```

## R2 Upload Pattern

Always use presigned URLs for portfolio uploads. Never pipe large files through the server.

```typescript
// 1. Client requests a presigned URL
// 2. Server generates it and returns to client
// 3. Client uploads directly to R2
// 4. Client notifies server of success — server saves URL to DB

// ID documents go through server (private bucket, not public)
// Contracts are server-generated and uploaded server-side
```

## Stripe Webhook

ALWAYS verify the Stripe signature before processing:

```typescript
app.post('/webhooks/stripe', async (c) => {
  const sig = c.req.header('stripe-signature')
  const rawBody = await c.req.text()

  const event = stripe.webhooks.constructEvent(rawBody, sig!, env.STRIPE_WEBHOOK_SECRET)
  // Only proceed if constructEvent doesn't throw
})
```

Events are now Stripe **Billing/subscription** events, not payment-intent events.
The webhook syncs `CasterSubscription` state from:

- `checkout.session.completed` — subscription created via Checkout
- `customer.subscription.created` / `customer.subscription.updated` / `customer.subscription.deleted` — status + period sync
- `invoice.payment_failed` — moves the subscription to `past_due` / `unpaid`

## Idempotency on Subscription Operations

Every subscription operation checks current state before acting:

```typescript
// Always guard against double-execution
if (sub.status === 'active' && sub.stripeSubscriptionId === event.subscriptionId) {
  return sub // Silent return — idempotent
}
// Webhook re-deliveries must not create duplicate CasterSubscription rows —
// upsert keyed on stripeSubscriptionId / casterId.
```

## Key Business Logic Locations

| Logic                                        | File                              |
| -------------------------------------------- | --------------------------------- |
| Subscription gating + Stripe Billing         | `services/SubscriptionService.ts` |
| Contract PDF generation                      | `services/ContractService.ts`     |
| Dispute resolution (record-only)             | `services/DisputeService.ts`      |
| Job expiry check (lazy)                      | `services/JobService.ts`          |
| Notification dispatch                        | `services/NotificationService.ts` |

## Lazy Evaluation (No Background Jobs in MVP)

Instead of scheduled jobs, check conditions at query time:

```typescript
// Subscription gate — evaluate the caster's live entitlement on job-post / bid-accept.
// A caster is entitled when the subscription is active or trialing AND not expired.
const entitled =
  sub != null &&
  (sub.status === 'active' || sub.status === 'trialing') &&
  sub.currentPeriodEnd > new Date()
if (!entitled) {
  throw new AppError('SUBSCRIPTION_REQUIRED', 'An active subscription is required', 402)
}

// Job expiry — filter in query, not via scheduler
where: { status: 'active', applicationDeadline: { gt: new Date() } }
```

## API Versioning

All routes: `/api/v1/...`
When breaking changes needed in future: introduce `/api/v2/...` — never break existing routes.

## Security Checklist (Every Endpoint)

- [ ] Authentication middleware applied
- [ ] Role guard applied where needed
- [ ] Input validated with Zod schema
- [ ] Ownership verified (user can only access own resources unless admin)
- [ ] Sensitive fields stripped from response (passwordHash, idDocumentUrl, stripeIds)
- [ ] Error messages don't leak internals

# Prisma Schema "./prisma/CLAUDE.md"
