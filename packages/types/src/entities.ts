import type {
  UserRole,
  UserStatus,
  ArtistType,
  ApprovalStatus,
  ExperienceLevel,
  AvailabilityStatus,
  SkinTone,
  JobCategory,
  JobStatus,
  JobVisibility,
  JobPaymentType,
  RateSetBy,
  BidStatus,
  BookingStatus,
  EscrowStatus,
  ContractStatus,
  DisputeReason,
  DisputeStatus,
  DisputeResolution,
  PortfolioItemType,
  CompanyType,
  InviteStatus,
  CancelledBy,
  ReviewerRole,
} from './enums'

export interface User {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  emailVerified: boolean
  emailVerifiedAt: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ArtistProfile {
  id: string
  userId: string
  artistType: ArtistType
  firstName: string
  lastName: string
  dob: string
  gender: string
  pronouns: string | null
  city: string
  bio: string | null
  experienceLevel: ExperienceLevel
  instagramHandle: string | null
  availabilityStatus: AvailabilityStatus
  approvalStatus: ApprovalStatus
  approvalNotes: string | null
  idVerified: boolean
  ratingAvg: number | null
  ratingCount: number
  jobsCompleted: number
  responseRate: number | null
  strikeCount: number
  createdAt: string
  updatedAt: string
  modelStats?: ModelStats | null
  actorStats?: ActorStats | null
  skills?: ArtistSkill[]
  portfolioItems?: PortfolioItem[]
}

export interface ModelStats {
  id: string
  artistProfileId: string
  heightCm: number
  weightKg: number | null
  dressSize: string
  shoeSize: string
  bustCm: number | null
  waistCm: number | null
  hipCm: number | null
  hairColour: string
  eyeColour: string
  skinTone: SkinTone
}

export interface ActorStats {
  id: string
  artistProfileId: string
  heightCm: number
  hairColour: string
  eyeColour: string
  voiceType: string | null
  spotlightUrl: string | null
  equityMember: boolean
  ageRangeMin: number
  ageRangeMax: number
}

export interface ArtistSkill {
  id: string
  artistProfileId: string
  skillType: string
  skillValue: string
}

export interface PortfolioItem {
  id: string
  artistProfileId: string
  type: PortfolioItemType
  url: string
  thumbnailUrl: string | null
  caption: string | null
  displayOrder: number
  isPrimary: boolean
  isApproved: boolean
  createdAt: string
}

export interface CasterProfile {
  id: string
  userId: string
  companyName: string
  companyType: CompanyType
  contactName: string
  phone: string | null
  website: string | null
  /** Public R2 URL to the caster's company logo. Optional — set via the
   *  upload-confirm path, cleared via PATCH /casters/me { logoUrl: null }. */
  logoUrl: string | null
  ratingAvg: number | null
  ratingCount: number
  jobsPosted: number
  onboardingCompletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Job {
  id: string
  casterId: string
  title: string
  description: string
  category: JobCategory
  subcategory: string | null
  visibility: JobVisibility
  status: JobStatus
  genderRequired: string
  ageMin: number | null
  ageMax: number | null
  locationCity: string
  physicalRequirements: Record<string, unknown> | null
  skillsRequired: string[]
  shootDate: string
  shootEndDate: string | null
  shootDurationHours: number
  callTime: string | null
  // NEVER returned before contract.status === 'fully_signed'
  shootLocationDetail: string | null
  // Payment type fields
  paymentType: JobPaymentType
  rateSetBy: RateSetBy
  rateAmount: number | null // null when rateSetBy = 'open'
  requiresNda: boolean
  exclusivity: boolean
  usageRights: string
  headcountRequired: number
  headcountFilled: number
  applicationDeadline: string
  autoExpiresAt: string
  createdAt: string
  updatedAt: string
  caster?: Pick<CasterProfile, 'id' | 'companyName'>
}

export interface JobInvite {
  id: string
  jobId: string
  artistId: string
  message: string | null
  status: InviteStatus
  createdAt: string
}

export interface Bid {
  id: string
  jobId: string
  artistId: string
  // fixed job: proposedRate = flat fee
  // hourly job: proposedRate = hourly rate
  proposedRate: number
  // Only present for hourly jobs
  estimatedHours: number | null
  coverNote: string
  highlightedPortfolioItems: string[]
  status: BidStatus
  rejectionReason: string | null
  submittedAt: string
  updatedAt: string
  artist?: Pick<ArtistProfile, 'id' | 'firstName' | 'lastName' | 'ratingAvg' | 'jobsCompleted'>
  portfolioHighlights?: PortfolioItem[]
}

export interface Booking {
  id: string
  jobId: string
  bidId: string
  casterId: string
  artistId: string
  // Locked at booking creation — never changes
  paymentType: JobPaymentType
  agreedRate: number // hourly: rate per hour. fixed: total flat fee
  agreedHours: number | null // hourly jobs only
  totalAmount: number // fixed: = agreedRate. hourly: = agreedRate × agreedHours
  shootDate: string
  // Hidden until contract.status === 'fully_signed'
  shootLocation: string
  callTime: string | null
  status: BookingStatus
  cancelledBy: CancelledBy | null
  cancelledAt: string | null
  cancellationReason: string | null
  completionConfirmedAt: string | null
  createdAt: string
  updatedAt: string
  contract?: Contract | null
  payment?: Payment | null
}

export interface Contract {
  id: string
  bookingId: string
  status: ContractStatus
  artistLegalName: string
  casterCompanyName: string
  jobTitle: string
  shootDate: string
  shootLocation: string
  // Snapshot of payment terms — never changes after creation
  paymentType: JobPaymentType
  agreedRate: number
  agreedHours: number | null
  totalAmount: number
  paymentTerms: string // e.g. "£500 flat rate" or "£85/hr × 8hrs = £680"
  usageRights: string
  exclusivity: boolean
  ndaIncluded: boolean
  artistSigned: boolean
  artistSignedAt: string | null
  casterSigned: boolean
  casterSignedAt: string | null
  pdfUrl: string | null // R2 URL — only present after both have signed
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  bookingId: string
  grossAmount: number // = booking.totalAmount — charged to caster
  platformCommissionRate: number // e.g. 15.00 for 15%
  platformCommissionAmount: number
  netArtistAmount: number // grossAmount - commissionAmount
  escrowStatus: EscrowStatus
  cancellationFeeAmount: number | null
  paidAt: string | null
  releasedAt: string | null
  autoReleaseAt: string // shoot_date + 48hrs
  refundedAt: string | null
  createdAt: string
}

export interface MessageThread {
  id: string
  jobId: string
  casterId: string
  artistId: string
  unlocked: boolean // true only after artist is shortlisted
  lastMessageAt: string | null
  createdAt: string
}

export interface Message {
  id: string
  threadId: string
  senderId: string
  content: string
  isFlagged: boolean
  readAt: string | null
  createdAt: string
}

export interface Review {
  id: string
  bookingId: string
  reviewerId: string
  /**
   * Exactly one of `artistRevieweeId` / `casterRevieweeId` is non-null.
   * When the reviewer is a caster (writing about the artist), only
   * `artistRevieweeId` is populated; when the reviewer is an artist
   * (writing about the caster), only `casterRevieweeId` is populated.
   * Enforced by a `reviews_exactly_one_reviewee` CHECK constraint.
   */
  artistRevieweeId: string | null
  casterRevieweeId: string | null
  reviewerRole: ReviewerRole
  rating: number // 1-5
  comment: string | null
  isFlagged: boolean
  isRemoved: boolean
  createdAt: string
}

export interface Dispute {
  id: string
  bookingId: string
  raisedById: string
  raisedAgainstId: string
  reason: DisputeReason
  description: string
  casterSubmission: string | null
  casterSubmittedAt: string | null
  artistSubmission: string | null
  artistSubmittedAt: string | null
  status: DisputeStatus
  adminNotes: string | null
  resolution: DisputeResolution | null
  splitArtistPct: number | null // e.g. 50 = artist gets 50%, caster gets 50%
  createdAt: string
  resolvedAt: string | null
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  body: string
  relatedEntityType: string | null
  relatedEntityId: string | null
  readAt: string | null
  createdAt: string
}

export interface AdminLog {
  id: string
  adminId: string
  action: string
  entityType: string
  entityId: string
  notes: string | null
  createdAt: string
}
