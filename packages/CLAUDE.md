# CastFlow Shared Packages — Claude Code Instructions

## Two Shared Packages

### 1. @castflow/types — TypeScript Interfaces

### 2. @castflow/validators — Zod Schemas

Both are imported by both `apps/web` and `apps/api`.
NEVER duplicate a type or schema in the app directories — always define here.

---

## Package Structure

```
packages/
├── types/
│   ├── src/
│   │   ├── index.ts          # Re-exports everything
│   │   ├── entities.ts       # All DB entity types
│   │   ├── api.ts            # API response/request shapes
│   │   ├── enums.ts          # All enum values
│   │   └── roles.ts          # Role/permission types
│   └── package.json
└── validators/
    ├── src/
    │   ├── index.ts
    │   ├── auth.ts           # Login, register schemas
    │   ├── artist.ts         # Artist onboarding, profile update
    │   ├── caster.ts         # Caster onboarding, profile update
    │   ├── job.ts            # Job create/edit — includes payment type logic
    │   ├── bid.ts            # Bid submit
    │   ├── booking.ts        # Booking actions
    │   ├── contract.ts       # Contract signing
    │   ├── review.ts         # Review submit
    │   ├── dispute.ts        # Dispute raise
    │   └── upload.ts         # Upload request
    └── package.json
```

---

## Core Enums (entities.ts)

```typescript
export type UserRole = 'admin' | 'caster' | 'artist'
export type UserStatus = 'pending' | 'active' | 'suspended' | 'banned'
export type ArtistType = 'model' | 'actor'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type ExperienceLevel = 'new_face' | 'semi_pro' | 'professional'
export type AvailabilityStatus = 'available' | 'unavailable'
export type SkinTone = 'fair' | 'light' | 'medium' | 'olive' | 'tan' | 'deep'

export type JobCategory = 'model' | 'actor' | 'voiceover' | 'extra'
export type JobStatus = 'draft' | 'active' | 'filled' | 'expired' | 'cancelled' | 'closed'
export type JobVisibility = 'public' | 'invite_only'

// TWO PAYMENT TYPES — like Upwork
export type JobPaymentType = 'fixed' | 'hourly'
// fixed  → caster posts a flat fee for the whole job (e.g. £500 for the shoot day)
// hourly → caster posts an hourly rate, artist bills for hours worked
// In both cases: rate can be set by caster OR left open for artists to propose

export type RateSetBy = 'caster' | 'open'
// caster → rate is fixed by caster, artists accept or don't bid
// open   → artists propose their own rate in their bid

export type BidStatus =
  | 'pending'
  | 'shortlisted'
  | 'rejected'
  | 'accepted'
  | 'withdrawn'
  | 'expired'
export type BookingStatus = 'pending_contract' | 'confirmed' | 'completed' | 'cancelled' | 'disputed'
// Caster platform-subscription state (mirrors Stripe). The platform's only
// charge is the caster subscription — there is NO escrow on job fees.
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'unpaid'
export type ContractStatus = 'pending_signatures' | 'partially_signed' | 'fully_signed' | 'voided'
export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'escalated'
export type DisputeResolution =
  | 'full_release_to_artist'
  | 'full_refund_to_caster'
  | 'split'
  | 'escalated'
export type PortfolioItemType = 'photo' | 'video'
export type CompanyType = 'brand' | 'agency' | 'production_house' | 'independent'
export type NotificationType =
  | 'artist_approved'
  | 'artist_rejected'
  | 'bid_received'
  | 'bid_shortlisted'
  | 'bid_rejected'
  | 'bid_accepted'
  | 'bid_expired'
  | 'booking_confirmed'
  | 'booking_cancelled_by_caster'
  | 'booking_cancelled_by_artist'
  | 'contract_ready'
  | 'contract_signed_by_other'
  | 'contract_fully_signed'
  | 'subscription_past_due'
  | 'dispute_opened'
  | 'dispute_resolved'
  | 'message_received'
  | 'job_matching_posted'
  | 'job_expiring_soon'
  | 'job_expired'
  | 'review_received'
```

---

## Key Entity Types (entities.ts)

```typescript
export interface Job {
  id: string
  casterId: string
  title: string
  description: string
  category: JobCategory
  subcategory: string | null
  visibility: JobVisibility
  status: JobStatus

  // Requirements
  genderRequired: 'male' | 'female' | 'non_binary' | 'any'
  ageMin: number | null
  ageMax: number | null
  locationCity: string
  physicalRequirements: Record<string, unknown> | null
  skillsRequired: string[]

  // Shoot details
  shootDate: string // ISO date
  shootEndDate: string | null
  shootDurationHours: number
  callTime: string | null // Only shown after contract signed
  shootLocationDetail: string | null // NEVER returned before contract fully_signed

  // Payment type — THE KEY FIELD
  paymentType: JobPaymentType // 'fixed' | 'hourly'
  rateSetBy: RateSetBy // 'caster' | 'open'
  rateAmount: number | null // null when rateSetBy = 'open'
  // ─────────────────────────────────────────────────────────
  // HOW THESE COMBINE:
  // paymentType='fixed',  rateSetBy='caster' → flat fee set by caster, artist bids yes/no
  // paymentType='fixed',  rateSetBy='open'   → flat fee, artist proposes their price
  // paymentType='hourly', rateSetBy='caster' → hourly rate set by caster, artist bids yes/no
  // paymentType='hourly', rateSetBy='open'   → hourly rate, artist proposes their hourly rate
  // ─────────────────────────────────────────────────────────

  // Legal
  requiresNda: boolean
  exclusivity: boolean
  usageRights: string

  // Headcount
  headcountRequired: number
  headcountFilled: number

  applicationDeadline: string
  createdAt: string
  updatedAt: string
}

export interface Bid {
  id: string
  jobId: string
  artistId: string

  // Rate fields match the job's payment type
  proposedRate: number // Hourly rate if job is hourly. Flat fee if job is fixed.
  estimatedHours: number | null // Only relevant if job.paymentType === 'hourly'
  totalEstimate: number | null // proposedRate × estimatedHours (computed, for hourly jobs)

  coverNote: string
  highlightedPortfolioItems: string[] // Array of PortfolioItem IDs
  status: BidStatus
  submittedAt: string
  updatedAt: string
}

export interface Booking {
  id: string
  jobId: string
  bidId: string
  casterId: string
  artistId: string

  // Payment type carried through from job — locked at booking creation
  paymentType: JobPaymentType
  agreedRate: number // Hourly rate OR flat fee — locked at bid acceptance
  agreedHours: number | null // Only for hourly jobs — agreed number of hours
  totalAmount: number // agreedRate × agreedHours for hourly. agreedRate for fixed.

  shootDate: string
  shootLocation: string // Full address — only returned after contract.status=fully_signed
  callTime: string | null
  status: BookingStatus
  cancelledBy: 'caster' | 'artist' | null
  cancelledAt: string | null
  cancellationReason: string | null
  completionConfirmedAt: string | null
  createdAt: string
  updatedAt: string
}

// NOTE: There is no Payment / escrow model. The monetization pivot removed
// escrow, commission, Stripe Connect and artist payouts. The platform's only
// charge is a recurring CASTER SUBSCRIPTION (Stripe Billing); job fees are
// paid caster→artist directly, off-platform. The relevant entity is now:

export interface CasterSubscription {
  id: string
  casterId: string
  stripeCustomerId: string
  stripeSubscriptionId: string | null
  status: SubscriptionStatus
  priceId: string | null
  currentPeriodEnd: string | null // entitlement = (active|trialing) AND not past this
  cancelAtPeriodEnd: boolean
  createdAt: string
  updatedAt: string
}
```

---

## API Response Types (api.ts)

```typescript
export interface ApiSuccess<T> {
  success: true
  data: T
  meta?: PaginationMeta
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    fields?: Record<string, string[]>
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  hasNext: boolean
}
```

---

## Key Validators (validators/job.ts)

```typescript
import { z } from 'zod'

export const createJobSchema = z
  .object({
    title: z.string().min(5).max(100).trim(),
    description: z.string().min(50).max(5000),
    category: z.enum(['model', 'actor', 'voiceover', 'extra']),
    subcategory: z.string().optional(),
    visibility: z.enum(['public', 'invite_only']).default('public'),

    genderRequired: z.enum(['male', 'female', 'non_binary', 'any']),
    ageMin: z.number().int().min(16).max(80).optional(),
    ageMax: z.number().int().min(16).max(80).optional(),
    locationCity: z.string().min(2),
    physicalRequirements: z.record(z.unknown()).optional(),
    skillsRequired: z.array(z.string()).optional(),

    shootDate: z
      .string()
      .datetime()
      .refine((d) => new Date(d) > new Date(), 'Shoot date must be in the future'),
    shootDurationHours: z.number().min(0.5).max(24),

    // Payment type — the key fields
    paymentType: z.enum(['fixed', 'hourly']),
    rateSetBy: z.enum(['caster', 'open']),
    rateAmount: z.number().min(1).max(100000).optional(),

    headcountRequired: z.number().int().min(1).max(50).default(1),
    applicationDeadline: z.string().datetime(),
    requiresNda: z.boolean().default(false),
    exclusivity: z.boolean().default(false),
    usageRights: z.string().max(500),
  })
  .refine((data) => !(data.rateSetBy === 'caster' && !data.rateAmount), {
    message: 'Rate amount required when caster sets the rate',
    path: ['rateAmount'],
  })

export const submitBidSchema = z.object({
  proposedRate: z.number().min(1), // Always required
  estimatedHours: z.number().min(0.5).optional(), // Required when job is hourly
  coverNote: z.string().min(20).max(500),
  highlightedPortfolioItems: z.array(z.string().uuid()).min(1).max(5),
})
// Note: add a .superRefine on the API side to check if estimatedHours is
// required based on the job's paymentType
```
