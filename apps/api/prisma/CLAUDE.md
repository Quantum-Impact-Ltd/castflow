# CastFlow Data Models — Claude Code Instructions

# Place this file at: apps/api/CLAUDE.md (or reference from it)

# This is the complete Prisma schema with all business rules annotated

## Full Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ────────────────────────────────────────────────────────────────────

enum UserRole {
  admin
  caster
  artist
}

enum UserStatus {
  pending
  active
  suspended
  banned
}

enum ArtistType {
  model
  actor
}

enum ApprovalStatus {
  pending
  approved
  rejected
}

enum ExperienceLevel {
  new_face
  semi_pro
  professional
}

enum AvailabilityStatus {
  available
  unavailable
}

enum SkinTone {
  fair
  light
  medium
  olive
  tan
  deep
}

enum JobCategory {
  model
  actor
  voiceover
  extra
}

enum JobStatus {
  draft
  active
  filled
  expired
  cancelled
  closed
}

enum JobVisibility {
  public
  invite_only
}

// TWO PAYMENT TYPES
enum JobPaymentType {
  fixed    // Flat fee for the whole job/shoot
  hourly   // Per-hour rate, artist bills for hours worked
}

enum RateSetBy {
  caster   // Rate is defined by caster — artists accept as-is
  open     // Artists propose their own rate in their bid
}

enum BidStatus {
  pending
  shortlisted
  rejected
  accepted
  withdrawn
  expired
}

enum BookingStatus {
  pending_payment
  confirmed
  completed
  cancelled
  disputed
}

enum EscrowStatus {
  awaiting_payment
  held
  released
  refunded
  partially_refunded
  disputed
}

enum ContractStatus {
  pending_signatures
  partially_signed
  fully_signed
  voided
}

enum DisputeStatus {
  open
  under_review
  resolved
  escalated
}

enum DisputeResolution {
  full_release_to_artist
  full_refund_to_caster
  split
  escalated
}

enum PortfolioItemType {
  photo
  video
}

enum CompanyType {
  brand
  agency
  production_house
  independent
}

enum InviteStatus {
  pending
  accepted
  declined
}

// ─── MODELS ───────────────────────────────────────────────────────────────────

model User {
  id                String    @id @default(uuid())
  email             String    @unique
  role              UserRole
  status            UserStatus @default(pending)
  emailVerified     Boolean   @default(false)
  emailVerifiedAt   DateTime?
  lastLoginAt       DateTime?
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  artistProfile     ArtistProfile?
  casterProfile     CasterProfile?
  // Better Auth manages its own session/account tables alongside this

  @@map("users")
}

model ArtistProfile {
  id                String            @id @default(uuid())
  userId            String            @unique @map("user_id")
  user              User              @relation(fields: [userId], references: [id])
  artistType        ArtistType        @map("artist_type")

  firstName         String            @map("first_name")
  lastName          String            @map("last_name")
  dob               DateTime
  gender            String
  pronouns          String?
  city              String
  bio               String?
  experienceLevel   ExperienceLevel   @map("experience_level")
  instagramHandle   String?           @map("instagram_handle")
  availabilityStatus AvailabilityStatus @default(available) @map("availability_status")

  approvalStatus    ApprovalStatus    @default(pending) @map("approval_status")
  approvalNotes     String?           @map("approval_notes")
  approvedById      String?           @map("approved_by_id")
  approvedAt        DateTime?         @map("approved_at")
  idDocumentUrl     String            @map("id_document_url")    // Private R2 key
  idVerified        Boolean           @default(false) @map("id_verified")

  // Cached stats — updated after each booking/review
  ratingAvg         Decimal?          @db.Decimal(2,1) @map("rating_avg")
  ratingCount       Int               @default(0) @map("rating_count")
  jobsCompleted     Int               @default(0) @map("jobs_completed")
  responseRate      Decimal?          @db.Decimal(5,2) @map("response_rate")
  strikeCount       Int               @default(0) @map("strike_count")

  createdAt         DateTime          @default(now()) @map("created_at")
  updatedAt         DateTime          @updatedAt @map("updated_at")

  modelStats        ModelStats?
  actorStats        ActorStats?
  skills            ArtistSkill[]
  portfolioItems    PortfolioItem[]
  bids              Bid[]
  bookings          Booking[]
  invites           JobInvite[]
  reviewsReceived   Review[]          @relation("RevieweeArtist")

  @@index([approvalStatus])
  @@index([artistType, city])
  @@map("artist_profiles")
}

model ModelStats {
  id                String         @id @default(uuid())
  artistProfileId   String         @unique @map("artist_profile_id")
  artistProfile     ArtistProfile  @relation(fields: [artistProfileId], references: [id])
  heightCm          Int            @map("height_cm")
  weightKg          Decimal?       @db.Decimal(4,1) @map("weight_kg")
  dressSize         String         @map("dress_size")
  shoeSize          String         @map("shoe_size")
  bustCm            Int?           @map("bust_cm")
  waistCm           Int?           @map("waist_cm")
  hipCm             Int?           @map("hip_cm")
  hairColour        String         @map("hair_colour")
  eyeColour         String         @map("eye_colour")
  skinTone          SkinTone       @map("skin_tone")

  @@map("model_stats")
}

model ActorStats {
  id                String         @id @default(uuid())
  artistProfileId   String         @unique @map("artist_profile_id")
  artistProfile     ArtistProfile  @relation(fields: [artistProfileId], references: [id])
  heightCm          Int            @map("height_cm")
  hairColour        String         @map("hair_colour")
  eyeColour         String         @map("eye_colour")
  voiceType         String?        @map("voice_type")
  spotlightUrl      String?        @map("spotlight_url")
  equityMember      Boolean        @default(false) @map("equity_member")
  ageRangeMin       Int            @map("age_range_min")
  ageRangeMax       Int            @map("age_range_max")

  @@map("actor_stats")
}

model ArtistSkill {
  id                String         @id @default(uuid())
  artistProfileId   String         @map("artist_profile_id")
  artistProfile     ArtistProfile  @relation(fields: [artistProfileId], references: [id])
  skillType         String         @map("skill_type")   // 'accent'|'language'|'special_skill'|'training'
  skillValue        String         @map("skill_value")

  @@map("artist_skills")
}

model PortfolioItem {
  id                String            @id @default(uuid())
  artistProfileId   String            @map("artist_profile_id")
  artistProfile     ArtistProfile     @relation(fields: [artistProfileId], references: [id])
  type              PortfolioItemType
  url               String            // CDN URL (public R2)
  thumbnailUrl      String?           @map("thumbnail_url")
  caption           String?
  displayOrder      Int               @map("display_order")
  isPrimary         Boolean           @default(false) @map("is_primary")
  isApproved        Boolean           @default(true) @map("is_approved")
  createdAt         DateTime          @default(now()) @map("created_at")

  @@map("portfolio_items")
}

model CasterProfile {
  id                String         @id @default(uuid())
  userId            String         @unique @map("user_id")
  user              User           @relation(fields: [userId], references: [id])
  companyName       String         @map("company_name")
  companyType       CompanyType    @map("company_type")
  contactName       String         @map("contact_name")
  phone             String?
  website           String?
  stripeCustomerId  String?        @map("stripe_customer_id")
  ratingAvg         Decimal?       @db.Decimal(2,1) @map("rating_avg")
  ratingCount       Int            @default(0) @map("rating_count")
  jobsPosted        Int            @default(0) @map("jobs_posted")
  createdAt         DateTime       @default(now()) @map("created_at")
  updatedAt         DateTime       @updatedAt @map("updated_at")

  jobs              Job[]
  bookings          Booking[]
  reviewsReceived   Review[]       @relation("RevieweeCaster")

  @@map("caster_profiles")
}

model Job {
  id                    String          @id @default(uuid())
  casterId              String          @map("caster_id")
  caster                CasterProfile   @relation(fields: [casterId], references: [id])
  title                 String
  description           String
  category              JobCategory
  subcategory           String?
  visibility            JobVisibility   @default(public)
  status                JobStatus       @default(active)

  genderRequired        String          @map("gender_required")
  ageMin                Int?            @map("age_min")
  ageMax                Int?            @map("age_max")
  locationCity          String          @map("location_city")
  physicalRequirements  Json?           @map("physical_requirements")
  skillsRequired        String[]        @map("skills_required")

  shootDate             DateTime        @map("shoot_date")
  shootEndDate          DateTime?       @map("shoot_end_date")
  shootDurationHours    Decimal         @db.Decimal(3,1) @map("shoot_duration_hours")
  callTime              DateTime?       @map("call_time")
  shootLocationDetail   String?         @map("shoot_location_detail")  // Hidden until contract signed

  // ── PAYMENT TYPE ──────────────────────────────────────────
  paymentType           JobPaymentType  @map("payment_type")
  // fixed: caster pays a flat fee total for the job
  // hourly: caster pays per hour worked

  rateSetBy             RateSetBy       @map("rate_set_by")
  // caster: rate defined by caster — shown to artists as fixed
  // open:   artists propose their own rate in their bid

  rateAmount            Decimal?        @db.Decimal(10,2) @map("rate_amount")
  // null when rateSetBy = 'open'
  // for hourly: this is the hourly rate
  // for fixed: this is the total flat fee
  // ──────────────────────────────────────────────────────────

  requiresNda           Boolean         @default(false) @map("requires_nda")
  exclusivity           Boolean         @default(false)
  usageRights           String          @map("usage_rights")

  headcountRequired     Int             @default(1) @map("headcount_required")
  headcountFilled       Int             @default(0) @map("headcount_filled")

  applicationDeadline   DateTime        @map("application_deadline")
  autoExpiresAt         DateTime        @map("auto_expires_at")

  createdAt             DateTime        @default(now()) @map("created_at")
  updatedAt             DateTime        @updatedAt @map("updated_at")

  bids                  Bid[]
  invites               JobInvite[]
  bookings              Booking[]
  messageThreads        MessageThread[]

  @@index([status, category, locationCity])
  @@index([casterId, status])
  @@index([applicationDeadline])
  @@map("jobs")
}

model JobInvite {
  id              String        @id @default(uuid())
  jobId           String        @map("job_id")
  job             Job           @relation(fields: [jobId], references: [id])
  artistId        String        @map("artist_id")
  artist          ArtistProfile @relation(fields: [artistId], references: [id])
  message         String?
  status          InviteStatus  @default(pending)
  createdAt       DateTime      @default(now()) @map("created_at")

  @@map("job_invites")
}

model Bid {
  id                        String        @id @default(uuid())
  jobId                     String        @map("job_id")
  job                       Job           @relation(fields: [jobId], references: [id])
  artistId                  String        @map("artist_id")
  artist                    ArtistProfile @relation(fields: [artistId], references: [id])

  // Rate fields — interpretation depends on job.paymentType
  proposedRate              Decimal       @db.Decimal(10,2) @map("proposed_rate")
  // If job.paymentType = 'fixed':  this is artist's proposed flat fee total
  // If job.paymentType = 'hourly': this is artist's proposed hourly rate

  estimatedHours            Decimal?      @db.Decimal(4,1) @map("estimated_hours")
  // Only used when job.paymentType = 'hourly'
  // Artist estimates how many hours the job will take
  // Used to show caster a total estimate (proposedRate × estimatedHours)

  coverNote                 String        @map("cover_note")
  highlightedPortfolioItems String[]      @map("highlighted_portfolio_items")
  status                    BidStatus     @default(pending)
  rejectionReason           String?       @map("rejection_reason")
  submittedAt               DateTime      @default(now()) @map("submitted_at")
  updatedAt                 DateTime      @updatedAt @map("updated_at")

  booking                   Booking?

  @@unique([jobId, artistId])   // One bid per artist per job — enforced at DB level
  @@index([artistId, status])
  @@index([jobId, status])
  @@map("bids")
}

model Booking {
  id                  String          @id @default(uuid())
  jobId               String          @map("job_id")
  job                 Job             @relation(fields: [jobId], references: [id])
  bidId               String          @unique @map("bid_id")
  bid                 Bid             @relation(fields: [bidId], references: [id])
  casterId            String          @map("caster_id")
  caster              CasterProfile   @relation(fields: [casterId], references: [id])
  artistId            String          @map("artist_id")
  artist              ArtistProfile   @relation(fields: [artistId], references: [id])

  // Payment type locked at booking creation — never changes
  paymentType         JobPaymentType  @map("payment_type")
  agreedRate          Decimal         @db.Decimal(10,2) @map("agreed_rate")
  // For hourly: this is the agreed HOURLY rate
  // For fixed: this is the agreed FLAT FEE total

  agreedHours         Decimal?        @db.Decimal(4,1) @map("agreed_hours")
  // For hourly jobs only: agreed number of hours
  // null for fixed jobs

  totalAmount         Decimal         @db.Decimal(10,2) @map("total_amount")
  // The total charged to caster and held in escrow
  // For fixed: = agreedRate
  // For hourly: = agreedRate × agreedHours

  shootDate           DateTime        @map("shoot_date")
  shootLocation       String          @map("shoot_location")  // Full address
  callTime            DateTime?       @map("call_time")
  status              BookingStatus   @default(pending_payment)
  cancelledBy         String?         @map("cancelled_by")
  cancelledAt         DateTime?       @map("cancelled_at")
  cancellationReason  String?         @map("cancellation_reason")
  completionConfirmedAt DateTime?     @map("completion_confirmed_at")
  createdAt           DateTime        @default(now()) @map("created_at")
  updatedAt           DateTime        @updatedAt @map("updated_at")

  contract            Contract?
  payment             Payment?
  reviews             Review[]
  dispute             Dispute?

  @@map("bookings")
}

model Contract {
  id                  String          @id @default(uuid())
  bookingId           String          @unique @map("booking_id")
  booking             Booking         @relation(fields: [bookingId], references: [id])
  status              ContractStatus  @default(pending_signatures)

  // Key terms — snapshot at creation, never changes
  artistLegalName     String          @map("artist_legal_name")
  casterCompanyName   String          @map("caster_company_name")
  jobTitle            String          @map("job_title")
  shootDate           DateTime        @map("shoot_date")
  shootLocation       String          @map("shoot_location")

  // Payment terms snapshot
  paymentType         JobPaymentType  @map("payment_type")
  agreedRate          Decimal         @db.Decimal(10,2) @map("agreed_rate")
  agreedHours         Decimal?        @db.Decimal(4,1) @map("agreed_hours")
  totalAmount         Decimal         @db.Decimal(10,2) @map("total_amount")
  paymentTerms        String          @map("payment_terms")
  // e.g. "£500 flat fee" or "£85/hr × 8hrs = £680"

  usageRights         String          @map("usage_rights")
  exclusivity         Boolean
  ndaIncluded         Boolean         @map("nda_included")

  artistSigned        Boolean         @default(false) @map("artist_signed")
  artistSignedAt      DateTime?       @map("artist_signed_at")
  artistSignatureStr  String?         @map("artist_signature_str")
  casterSigned        Boolean         @default(false) @map("caster_signed")
  casterSignedAt      DateTime?       @map("caster_signed_at")
  casterSignatureStr  String?         @map("caster_signature_str")

  pdfUrl              String?         @map("pdf_url")   // R2 URL after both sign
  createdAt           DateTime        @default(now()) @map("created_at")
  updatedAt           DateTime        @updatedAt @map("updated_at")

  @@map("contracts")
}

model Payment {
  id                        String        @id @default(uuid())
  bookingId                 String        @unique @map("booking_id")
  booking                   Booking       @relation(fields: [bookingId], references: [id])

  stripePaymentIntentId     String        @unique @map("stripe_payment_intent_id")
  stripeChargeId            String?       @map("stripe_charge_id")
  stripeTransferId          String?       @map("stripe_transfer_id")

  grossAmount               Decimal       @db.Decimal(10,2) @map("gross_amount")
  // = booking.totalAmount — what caster pays into escrow

  platformCommissionRate    Decimal       @db.Decimal(4,2) @map("platform_commission_rate")
  platformCommissionAmount  Decimal       @db.Decimal(10,2) @map("platform_commission_amount")
  netArtistAmount           Decimal       @db.Decimal(10,2) @map("net_artist_amount")
  // grossAmount - platformCommissionAmount

  escrowStatus              EscrowStatus  @default(awaiting_payment) @map("escrow_status")
  cancellationFeeAmount     Decimal?      @db.Decimal(10,2) @map("cancellation_fee_amount")

  paidAt                    DateTime?     @map("paid_at")
  releasedAt                DateTime?     @map("released_at")
  autoReleaseAt             DateTime      @map("auto_release_at")  // shoot_date + 48hrs
  refundedAt                DateTime?     @map("refunded_at")
  createdAt                 DateTime      @default(now()) @map("created_at")

  @@map("payments")
}

model MessageThread {
  id          String        @id @default(uuid())
  jobId       String        @map("job_id")
  job         Job           @relation(fields: [jobId], references: [id])
  casterId    String        @map("caster_id")
  artistId    String        @map("artist_id")
  unlocked    Boolean       @default(false)  // true only after artist is shortlisted
  lastMessageAt DateTime?   @map("last_message_at")
  createdAt   DateTime      @default(now()) @map("created_at")

  messages    Message[]

  @@unique([jobId, casterId, artistId])
  @@map("message_threads")
}

model Message {
  id          String        @id @default(uuid())
  threadId    String        @map("thread_id")
  thread      MessageThread @relation(fields: [threadId], references: [id])
  senderId    String        @map("sender_id")
  content     String
  isFlagged   Boolean       @default(false) @map("is_flagged")
  readAt      DateTime?     @map("read_at")
  createdAt   DateTime      @default(now()) @map("created_at")

  @@index([threadId, createdAt])
  @@map("messages")
}

model Review {
  id                String   @id @default(uuid())
  bookingId         String   @map("booking_id")
  booking           Booking  @relation(fields: [bookingId], references: [id])
  reviewerId        String   @map("reviewer_id")
  // Exactly one of these two is set, never both — a caster reviewing the
  // artist populates `artistRevieweeId`; an artist reviewing the caster
  // populates `casterRevieweeId`. Enforced at the service layer plus a
  // `reviews_exactly_one_reviewee` CHECK constraint applied via raw SQL
  // (`prisma db push` does not emit CHECK clauses).
  artistRevieweeId  String?  @map("artist_reviewee_id")
  casterRevieweeId  String?  @map("caster_reviewee_id")
  reviewerRole      String   @map("reviewer_role")  // 'caster' | 'artist'
  rating            Int      // 1-5
  comment           String?
  isFlagged         Boolean  @default(false) @map("is_flagged")
  flagReason        String?  @map("flag_reason")
  isRemoved         Boolean  @default(false) @map("is_removed")

  // Each relation targets ONE table only — no more dual-FK violation.
  artistReviewee    ArtistProfile? @relation("RevieweeArtist", fields: [artistRevieweeId], references: [id])
  casterReviewee    CasterProfile? @relation("RevieweeCaster", fields: [casterRevieweeId], references: [id])

  createdAt         DateTime @default(now()) @map("created_at")

  @@unique([bookingId, reviewerId])
  @@index([artistRevieweeId])
  @@index([casterRevieweeId])
  @@map("reviews")
}

model Dispute {
  id                  String            @id @default(uuid())
  bookingId           String            @unique @map("booking_id")
  booking             Booking           @relation(fields: [bookingId], references: [id])
  raisedById          String            @map("raised_by_id")
  raisedAgainstId     String            @map("raised_against_id")
  reason              String
  description         String

  casterSubmission    String?           @map("caster_submission")
  casterSubmittedAt   DateTime?         @map("caster_submitted_at")
  artistSubmission    String?           @map("artist_submission")
  artistSubmittedAt   DateTime?         @map("artist_submitted_at")

  status              DisputeStatus     @default(open)
  adminNotes          String?           @map("admin_notes")
  resolvedById        String?           @map("resolved_by_id")
  resolution          DisputeResolution?
  splitArtistPct      Int?              @map("split_artist_pct")

  createdAt           DateTime          @default(now()) @map("created_at")
  resolvedAt          DateTime?         @map("resolved_at")

  @@map("disputes")
}

model Notification {
  id                  String    @id @default(uuid())
  userId              String    @map("user_id")
  type                String    // NotificationType enum as string
  title               String
  body                String
  relatedEntityType   String?   @map("related_entity_type")
  relatedEntityId     String?   @map("related_entity_id")
  readAt              DateTime? @map("read_at")
  createdAt           DateTime  @default(now()) @map("created_at")

  @@index([userId, readAt])
  @@map("notifications")
}

model AdminLog {
  id          String    @id @default(uuid())
  adminId     String    @map("admin_id")
  action      String
  entityType  String    @map("entity_type")
  entityId    String    @map("entity_id")
  notes       String?
  createdAt   DateTime  @default(now()) @map("created_at")

  @@map("admin_logs")
}
```

---

## Payment Type Business Logic — Critical

### When job.paymentType = 'fixed'

- Caster is paying a flat fee for the whole shoot
- `rateAmount` on Job = total flat fee (e.g. £500)
- `proposedRate` on Bid = artist's counter flat fee (if rateSetBy = 'open')
- `estimatedHours` on Bid = null (not used)
- `totalAmount` on Booking = agreedRate (the flat fee)
- Contract shows: "Fee: £500 flat rate"

### When job.paymentType = 'hourly'

- Caster pays per hour worked
- `rateAmount` on Job = hourly rate (e.g. £85/hr)
- `proposedRate` on Bid = artist's hourly rate
- `estimatedHours` on Bid = hours artist estimates for the job (e.g. 8hrs)
- `totalEstimate` (computed) = proposedRate × estimatedHours (shown to caster for comparison)
- `agreedHours` on Booking = agreed number of hours (from bid or negotiated)
- `totalAmount` on Booking = agreedRate × agreedHours
- Escrow = totalAmount (full amount locked up front)
- Contract shows: "Rate: £85/hr × 8 hours = £680"

### Displaying to Artists on the Job Feed

```
Fixed + caster sets rate:  "£500 flat fee"
Fixed + open:              "Open — propose your fee"
Hourly + caster sets rate: "£85/hr (est. X hours)"
Hourly + open:             "Open — propose your hourly rate"
```

### Bid Comparison for Casters (Bids Panel)

- Fixed jobs: sort by `proposedRate` ascending (cheapest first option)
- Hourly jobs: sort by `proposedRate × estimatedHours` ascending (total cost estimate)
- Always show both the hourly rate AND the total estimate for hourly bids
