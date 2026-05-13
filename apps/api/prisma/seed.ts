/**
 * CastFlow development seed.
 *
 * Idempotent: re-running upserts users + their profiles, jobs, bids, bookings,
 * contracts, payments, reviews, disputes, invites, threads, messages, and
 * notifications without dupes. Safe to run repeatedly. Set FRESH=1 to wipe
 * CastFlow domain data first (does NOT touch the Better Auth user/account
 * tables — those go through signUpEmail).
 *
 * Default password for every account: `Password123!`
 * Credentials are printed at the end.
 */

import { PrismaClient, Prisma } from '@prisma/client'
import { auth } from '../src/lib/auth'

const prisma = new PrismaClient()

const DEFAULT_PASSWORD = 'Password123!'
const COMMISSION_RATE = 15

// ─── Time helpers ─────────────────────────────────────────────────────────────

const DAY = 24 * 60 * 60 * 1000
const now = new Date()
const daysFromNow = (n: number) => new Date(now.getTime() + n * DAY)
const daysAgo = (n: number) => new Date(now.getTime() - n * DAY)
const yearsAgo = (n: number) => new Date(now.getTime() - n * 365 * DAY)

// ─── User bootstrap via Better Auth ───────────────────────────────────────────

interface UserSpec {
  email: string
  name: string
  role: 'admin' | 'caster' | 'artist'
  status?: 'active' | 'pending' | 'suspended' | 'banned'
  emailVerified?: boolean
  approvalStatus?: 'pending' | 'approved' | 'rejected' | null
}

async function ensureUser(spec: UserSpec) {
  const existing = await prisma.user.findUnique({ where: { email: spec.email } })

  if (!existing) {
    try {
      await auth.api.signUpEmail({
        body: { email: spec.email, password: DEFAULT_PASSWORD, name: spec.name },
      })
    } catch (err) {
      // signUpEmail can throw if email already exists due to a race or a prior
      // half-run. Look it up and continue.
      const probe = await prisma.user.findUnique({ where: { email: spec.email } })
      if (!probe) throw err
    }
  }

  // Apply our domain overrides — role/status/approvalStatus/emailVerified are
  // forced here so reruns converge on the desired shape even if Better Auth
  // defaulted them on creation.
  return prisma.user.update({
    where: { email: spec.email },
    data: {
      role: spec.role,
      status: spec.status ?? 'active',
      emailVerified: spec.emailVerified ?? true,
      approvalStatus: spec.approvalStatus ?? null,
      name: spec.name,
    },
  })
}

// ─── Deterministic IDs ────────────────────────────────────────────────────────

const ID = {
  caster: (k: string) => `cp_seed_${k}`,
  artist: (k: string) => `ap_seed_${k}`,
  job: (k: string) => `job_seed_${k}`,
  bid: (job: string, artist: string) => `bid_seed_${job}_${artist}`,
  invite: (job: string, artist: string) => `inv_seed_${job}_${artist}`,
  booking: (k: string) => `bk_seed_${k}`,
  contract: (k: string) => `ct_seed_${k}`,
  payment: (k: string) => `pay_seed_${k}`,
  review: (bk: string, by: string) => `rv_seed_${bk}_${by}`,
  dispute: (k: string) => `dp_seed_${k}`,
  thread: (job: string, artist: string) => `th_seed_${job}_${artist}`,
  message: (k: string) => `msg_seed_${k}`,
  notif: (k: string) => `nt_seed_${k}`,
  portfolio: (artist: string, n: number) => `pf_seed_${artist}_${n}`,
  skill: (artist: string, n: number) => `sk_seed_${artist}_${n}`,
  stats: (artist: string) => `st_seed_${artist}`,
  log: (k: string) => `lg_seed_${k}`,
}

// ─── Optional FRESH wipe ──────────────────────────────────────────────────────

async function wipeIfRequested() {
  if (process.env.FRESH !== '1') return
  console.info('🧨 FRESH=1 — wiping CastFlow domain data (preserving Better Auth users)…')
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.adminLog.deleteMany(),
    prisma.message.deleteMany(),
    prisma.messageThread.deleteMany(),
    prisma.review.deleteMany(),
    prisma.dispute.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.contract.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.counterOffer.deleteMany(),
    prisma.bid.deleteMany(),
    prisma.jobInvite.deleteMany(),
    prisma.job.deleteMany(),
    prisma.portfolioItem.deleteMany(),
    prisma.artistSkill.deleteMany(),
    prisma.modelStats.deleteMany(),
    prisma.actorStats.deleteMany(),
    prisma.artistProfile.deleteMany(),
    prisma.casterProfile.deleteMany(),
  ])
}

// ─── Caster + Artist creation ─────────────────────────────────────────────────

interface CasterSpec {
  key: string
  email: string
  name: string
  companyName: string
  companyType: 'brand' | 'agency' | 'production_house' | 'independent'
  contactName: string
  phone?: string
  website?: string
}

async function ensureCaster(spec: CasterSpec) {
  const user = await ensureUser({
    email: spec.email,
    name: spec.name,
    role: 'caster',
    status: 'active',
  })

  const caster = await prisma.casterProfile.upsert({
    where: { id: ID.caster(spec.key) },
    create: {
      id: ID.caster(spec.key),
      userId: user.id,
      companyName: spec.companyName,
      companyType: spec.companyType,
      contactName: spec.contactName,
      phone: spec.phone ?? null,
      website: spec.website ?? null,
    },
    update: {
      companyName: spec.companyName,
      companyType: spec.companyType,
      contactName: spec.contactName,
      phone: spec.phone ?? null,
      website: spec.website ?? null,
    },
  })

  await prisma.user.update({
    where: { id: user.id },
    data: { profileId: caster.id },
  })

  return { user, caster }
}

interface ArtistSpec {
  key: string
  email: string
  name: string
  firstName: string
  lastName: string
  artistType: 'model' | 'actor'
  gender: string
  pronouns?: string
  city: string
  bio: string
  dob: Date
  experienceLevel: 'new_face' | 'semi_pro' | 'professional'
  instagramHandle?: string
  approvalStatus: 'pending' | 'approved' | 'rejected'
  payoutsEnabled?: boolean
  stripeAccountId?: string
  modelStats?: {
    heightCm: number
    weightKg?: number
    dressSize: string
    shoeSize: string
    bustCm?: number
    waistCm?: number
    hipCm?: number
    hairColour: string
    eyeColour: string
    skinTone: 'fair' | 'light' | 'medium' | 'olive' | 'tan' | 'deep'
  }
  actorStats?: {
    heightCm: number
    hairColour: string
    eyeColour: string
    voiceType?: string
    spotlightUrl?: string
    equityMember?: boolean
    ageRangeMin: number
    ageRangeMax: number
  }
  skills: { skillType: 'accent' | 'language' | 'special_skill' | 'training'; skillValue: string }[]
  portfolio: { caption: string; isPrimary?: boolean }[]
  ratingAvg?: number
  ratingCount?: number
  jobsCompleted?: number
}

async function ensureArtist(spec: ArtistSpec, approverId?: string) {
  const user = await ensureUser({
    email: spec.email,
    name: spec.name,
    role: 'artist',
    status: 'active',
    approvalStatus: spec.approvalStatus,
  })

  const artistData: Prisma.ArtistProfileUncheckedCreateInput = {
    id: ID.artist(spec.key),
    userId: user.id,
    artistType: spec.artistType,
    firstName: spec.firstName,
    lastName: spec.lastName,
    dob: spec.dob,
    gender: spec.gender,
    pronouns: spec.pronouns ?? null,
    city: spec.city,
    bio: spec.bio,
    experienceLevel: spec.experienceLevel,
    instagramHandle: spec.instagramHandle ?? null,
    approvalStatus: spec.approvalStatus,
    approvedById: spec.approvalStatus === 'approved' ? approverId ?? null : null,
    approvedAt: spec.approvalStatus === 'approved' ? daysAgo(30) : null,
    submittedAt: daysAgo(45),
    idDocumentUrl: `seed/id-docs/${spec.key}.jpg`,
    idVerified: spec.approvalStatus === 'approved',
    payoutsEnabled: spec.payoutsEnabled ?? false,
    stripeAccountId: spec.stripeAccountId ?? null,
    ratingAvg: spec.ratingAvg ? new Prisma.Decimal(spec.ratingAvg) : null,
    ratingCount: spec.ratingCount ?? 0,
    jobsCompleted: spec.jobsCompleted ?? 0,
  }

  const artist = await prisma.artistProfile.upsert({
    where: { id: ID.artist(spec.key) },
    create: artistData,
    update: artistData,
  })

  await prisma.user.update({
    where: { id: user.id },
    data: { profileId: artist.id },
  })

  if (spec.modelStats) {
    await prisma.modelStats.upsert({
      where: { artistProfileId: artist.id },
      create: {
        id: ID.stats(spec.key),
        artistProfileId: artist.id,
        ...spec.modelStats,
        weightKg: spec.modelStats.weightKg
          ? new Prisma.Decimal(spec.modelStats.weightKg)
          : null,
      },
      update: {
        ...spec.modelStats,
        weightKg: spec.modelStats.weightKg
          ? new Prisma.Decimal(spec.modelStats.weightKg)
          : null,
      },
    })
  }

  if (spec.actorStats) {
    await prisma.actorStats.upsert({
      where: { artistProfileId: artist.id },
      create: {
        id: ID.stats(spec.key),
        artistProfileId: artist.id,
        ...spec.actorStats,
      },
      update: { ...spec.actorStats },
    })
  }

  await prisma.artistSkill.deleteMany({ where: { artistProfileId: artist.id } })
  if (spec.skills.length) {
    await prisma.artistSkill.createMany({
      data: spec.skills.map((s, i) => ({
        id: ID.skill(spec.key, i),
        artistProfileId: artist.id,
        skillType: s.skillType,
        skillValue: s.skillValue,
      })),
    })
  }

  await prisma.portfolioItem.deleteMany({ where: { artistProfileId: artist.id } })
  if (spec.portfolio.length) {
    await prisma.portfolioItem.createMany({
      data: spec.portfolio.map((p, i) => ({
        id: ID.portfolio(spec.key, i),
        artistProfileId: artist.id,
        type: 'photo',
        url: `https://picsum.photos/seed/${spec.key}-${i}/800/1200`,
        thumbnailUrl: `https://picsum.photos/seed/${spec.key}-${i}/200/300`,
        caption: p.caption,
        displayOrder: i,
        isPrimary: p.isPrimary ?? i === 0,
        isApproved: true,
      })),
    })
  }

  return { user, artist }
}

// ─── Domain creators ──────────────────────────────────────────────────────────

interface JobSpec {
  key: string
  casterId: string
  title: string
  description: string
  category: 'model' | 'actor' | 'voiceover' | 'extra'
  subcategory?: string
  status?: 'draft' | 'active' | 'filled' | 'expired' | 'cancelled' | 'closed'
  visibility?: 'public' | 'invite_only'
  genderRequired: string
  ageMin?: number
  ageMax?: number
  locationCity: string
  skillsRequired?: string[]
  shootDate: Date
  shootEndDate?: Date
  shootDurationHours: number
  callTime?: Date
  shootLocationDetail?: string
  paymentType: 'fixed' | 'hourly'
  rateSetBy: 'caster' | 'open'
  rateAmount?: number
  requiresNda?: boolean
  exclusivity?: boolean
  usageRights: string
  headcountRequired?: number
  headcountFilled?: number
  applicationDeadline: Date
  autoExpiresAt?: Date
}

async function upsertJob(spec: JobSpec) {
  const data: Prisma.JobUncheckedCreateInput = {
    id: ID.job(spec.key),
    casterId: spec.casterId,
    title: spec.title,
    description: spec.description,
    category: spec.category,
    subcategory: spec.subcategory ?? null,
    status: spec.status ?? 'active',
    visibility: spec.visibility ?? 'public',
    genderRequired: spec.genderRequired,
    ageMin: spec.ageMin ?? null,
    ageMax: spec.ageMax ?? null,
    locationCity: spec.locationCity,
    skillsRequired: spec.skillsRequired ?? [],
    shootDate: spec.shootDate,
    shootEndDate: spec.shootEndDate ?? spec.shootDate,
    shootDurationHours: new Prisma.Decimal(spec.shootDurationHours),
    callTime: spec.callTime ?? null,
    shootLocationDetail: spec.shootLocationDetail ?? null,
    paymentType: spec.paymentType,
    rateSetBy: spec.rateSetBy,
    rateAmount: spec.rateAmount != null ? new Prisma.Decimal(spec.rateAmount) : null,
    requiresNda: spec.requiresNda ?? false,
    exclusivity: spec.exclusivity ?? false,
    usageRights: spec.usageRights,
    headcountRequired: spec.headcountRequired ?? 1,
    headcountFilled: spec.headcountFilled ?? 0,
    applicationDeadline: spec.applicationDeadline,
    autoExpiresAt: spec.autoExpiresAt ?? spec.applicationDeadline,
  }
  return prisma.job.upsert({
    where: { id: ID.job(spec.key) },
    create: data,
    update: data,
  })
}

interface BidSpec {
  jobKey: string
  artistKey: string
  jobId: string
  artistId: string
  proposedRate: number
  estimatedHours?: number
  coverNote: string
  status?: 'pending' | 'shortlisted' | 'rejected' | 'accepted' | 'withdrawn' | 'expired'
  highlightedPortfolioItems?: string[]
  rejectionReason?: string
  submittedAt?: Date
}

async function upsertBid(spec: BidSpec) {
  const data: Prisma.BidUncheckedCreateInput = {
    id: ID.bid(spec.jobKey, spec.artistKey),
    jobId: spec.jobId,
    artistId: spec.artistId,
    proposedRate: new Prisma.Decimal(spec.proposedRate),
    estimatedHours:
      spec.estimatedHours != null ? new Prisma.Decimal(spec.estimatedHours) : null,
    coverNote: spec.coverNote,
    status: spec.status ?? 'pending',
    highlightedPortfolioItems: spec.highlightedPortfolioItems ?? [],
    rejectionReason: spec.rejectionReason ?? null,
    submittedAt: spec.submittedAt ?? daysAgo(2),
  }
  return prisma.bid.upsert({
    where: { id: ID.bid(spec.jobKey, spec.artistKey) },
    create: data,
    update: data,
  })
}

// ─── Main orchestration ───────────────────────────────────────────────────────

async function main() {
  console.info('🌱 Seeding CastFlow…')
  await wipeIfRequested()

  // ── ADMIN ──────────────────────────────────────────────────────────────────
  const admin = await ensureUser({
    email: 'admin@castflow.test',
    name: 'Ada Admin',
    role: 'admin',
    status: 'active',
    emailVerified: true,
  })

  // ── CASTERS ────────────────────────────────────────────────────────────────
  const { caster: acme, user: acmeUser } = await ensureCaster({
    key: 'acme',
    email: 'caster1@castflow.test',
    name: 'Hannah Lloyd',
    companyName: 'Acme Studios London',
    companyType: 'brand',
    contactName: 'Hannah Lloyd',
    phone: '+44 20 7946 0958',
    website: 'https://acme-studios.example.co.uk',
  })

  const { caster: goldsmith, user: goldsmithUser } = await ensureCaster({
    key: 'goldsmith',
    email: 'caster2@castflow.test',
    name: 'Marcus Goldsmith',
    companyName: 'Goldsmith Casting Agency',
    companyType: 'agency',
    contactName: 'Marcus Goldsmith',
    phone: '+44 20 7946 0102',
    website: 'https://goldsmith-casting.example.co.uk',
  })

  // ── ARTISTS — APPROVED ────────────────────────────────────────────────────
  const { artist: sophie, user: sophieUser } = await ensureArtist(
    {
      key: 'sophie',
      email: 'artist1@castflow.test',
      name: 'Sophie Carter',
      firstName: 'Sophie',
      lastName: 'Carter',
      artistType: 'model',
      gender: 'female',
      pronouns: 'she/her',
      city: 'London',
      bio: 'Editorial and commercial model based in London. Five years of catwalk experience with London, Paris, and Milan fashion weeks. Versatile across high-fashion editorial, lifestyle commercial, and beauty.',
      dob: yearsAgo(26),
      experienceLevel: 'professional',
      instagramHandle: '@sophiecartermodel',
      approvalStatus: 'approved',
      payoutsEnabled: true,
      stripeAccountId: 'acct_seed_sophie',
      ratingAvg: 4.8,
      ratingCount: 12,
      jobsCompleted: 14,
      modelStats: {
        heightCm: 178,
        weightKg: 56,
        dressSize: 'UK 8',
        shoeSize: 'UK 6',
        bustCm: 84,
        waistCm: 62,
        hipCm: 90,
        hairColour: 'Brown',
        eyeColour: 'Green',
        skinTone: 'fair',
      },
      skills: [
        { skillType: 'language', skillValue: 'English (native)' },
        { skillType: 'language', skillValue: 'French (conversational)' },
        { skillType: 'special_skill', skillValue: 'Horse riding' },
        { skillType: 'training', skillValue: 'Central Saint Martins — short course' },
      ],
      portfolio: [
        { caption: 'Vogue UK — March 2026 editorial', isPrimary: true },
        { caption: 'Burberry SS26 lookbook' },
        { caption: 'Net-a-Porter campaign — Spring drop' },
        { caption: 'Headshot — natural light' },
        { caption: 'Beauty close-up — Hourglass Cosmetics' },
      ],
    },
    admin.id,
  )

  const { artist: james, user: jamesUser } = await ensureArtist(
    {
      key: 'james',
      email: 'artist2@castflow.test',
      name: "James O'Hara",
      firstName: 'James',
      lastName: "O'Hara",
      artistType: 'actor',
      gender: 'male',
      pronouns: 'he/him',
      city: 'Manchester',
      bio: 'Equity-registered actor with a focus on TV drama and commercial work. Trained at RADA, recent credits include guest leads on Coronation Street and BBC One. Strong accents (RP, Northern, Irish).',
      dob: yearsAgo(32),
      experienceLevel: 'professional',
      instagramHandle: '@jamesohara.actor',
      approvalStatus: 'approved',
      payoutsEnabled: true,
      stripeAccountId: 'acct_seed_james',
      ratingAvg: 4.9,
      ratingCount: 8,
      jobsCompleted: 9,
      actorStats: {
        heightCm: 183,
        hairColour: 'Dark brown',
        eyeColour: 'Blue',
        voiceType: 'Baritone',
        spotlightUrl: 'https://www.spotlight.com/profile/seed-james-ohara',
        equityMember: true,
        ageRangeMin: 28,
        ageRangeMax: 38,
      },
      skills: [
        { skillType: 'accent', skillValue: 'RP' },
        { skillType: 'accent', skillValue: 'Northern Irish' },
        { skillType: 'accent', skillValue: 'Mancunian' },
        { skillType: 'special_skill', skillValue: 'Stage combat (BADC certified)' },
        { skillType: 'training', skillValue: 'RADA — BA Acting (2018)' },
      ],
      portfolio: [
        { caption: 'Headshot — colour, 2026', isPrimary: true },
        { caption: 'Showreel still — BBC drama' },
        { caption: 'Theatre — Hamlet, Royal Exchange' },
        { caption: "Commercial — Sainsbury's Christmas 2025" },
      ],
    },
    admin.id,
  )

  const { artist: priya, user: priyaUser } = await ensureArtist(
    {
      key: 'priya',
      email: 'artist3@castflow.test',
      name: 'Priya Patel',
      firstName: 'Priya',
      lastName: 'Patel',
      artistType: 'model',
      gender: 'female',
      pronouns: 'she/her',
      city: 'London',
      bio: 'Plus-size model and body-positivity advocate. Featured in ASOS Curve, Pretty Little Thing, and Vogue India digital editorials. Brings warmth and confidence to commercial sets.',
      dob: yearsAgo(28),
      experienceLevel: 'semi_pro',
      instagramHandle: '@priyapatelmodel',
      approvalStatus: 'approved',
      payoutsEnabled: false,
      ratingAvg: 4.6,
      ratingCount: 5,
      jobsCompleted: 6,
      modelStats: {
        heightCm: 172,
        weightKg: 78,
        dressSize: 'UK 16',
        shoeSize: 'UK 7',
        bustCm: 102,
        waistCm: 86,
        hipCm: 112,
        hairColour: 'Black',
        eyeColour: 'Dark brown',
        skinTone: 'tan',
      },
      skills: [
        { skillType: 'language', skillValue: 'English (native)' },
        { skillType: 'language', skillValue: 'Gujarati (fluent)' },
        { skillType: 'language', skillValue: 'Hindi (conversational)' },
        { skillType: 'special_skill', skillValue: 'Bharatanatyam dance' },
      ],
      portfolio: [
        { caption: 'ASOS Curve — Autumn 2025', isPrimary: true },
        { caption: 'Editorial — Vogue India digital' },
        { caption: 'Lifestyle — Pretty Little Thing' },
        { caption: 'Beauty — Fenty UK' },
      ],
    },
    admin.id,
  )

  const { artist: marcus, user: marcusUser } = await ensureArtist(
    {
      key: 'marcus',
      email: 'artist4@castflow.test',
      name: 'Marcus Thompson',
      firstName: 'Marcus',
      lastName: 'Thompson',
      artistType: 'actor',
      gender: 'male',
      pronouns: 'he/him',
      city: 'Bristol',
      bio: 'Voice-over specialist and screen actor. 12 years on the mic — corporate, eLearning, animation, video games. Trained ear for ADR and self-direction. Home studio (Neumann TLM 103, treated booth).',
      dob: yearsAgo(41),
      experienceLevel: 'professional',
      approvalStatus: 'approved',
      payoutsEnabled: true,
      stripeAccountId: 'acct_seed_marcus',
      ratingAvg: 4.7,
      ratingCount: 22,
      jobsCompleted: 27,
      actorStats: {
        heightCm: 180,
        hairColour: 'Salt and pepper',
        eyeColour: 'Hazel',
        voiceType: 'Warm baritone',
        equityMember: false,
        ageRangeMin: 35,
        ageRangeMax: 50,
      },
      skills: [
        { skillType: 'accent', skillValue: 'RP' },
        { skillType: 'accent', skillValue: 'General American' },
        { skillType: 'accent', skillValue: 'West Country' },
        { skillType: 'language', skillValue: 'English (native)' },
        { skillType: 'special_skill', skillValue: 'Home studio (broadcast quality)' },
        { skillType: 'special_skill', skillValue: 'ipDTL / Source-Connect ready' },
      ],
      portfolio: [
        { caption: 'Home studio setup', isPrimary: true },
        { caption: 'Documentary VO — Channel 4' },
        { caption: 'Audible audiobook narration' },
      ],
    },
    admin.id,
  )

  const { artist: emma, user: emmaUser } = await ensureArtist(
    {
      key: 'emma',
      email: 'artist5@castflow.test',
      name: 'Emma Wilson',
      firstName: 'Emma',
      lastName: 'Wilson',
      artistType: 'model',
      gender: 'female',
      pronouns: 'she/her',
      city: 'Edinburgh',
      bio: 'New-face commercial model focused on lifestyle, fitness, and wellness brands. Started in 2024, growing portfolio quickly across catalogue and e-commerce.',
      dob: yearsAgo(22),
      experienceLevel: 'new_face',
      approvalStatus: 'approved',
      payoutsEnabled: false,
      ratingAvg: 4.5,
      ratingCount: 2,
      jobsCompleted: 3,
      modelStats: {
        heightCm: 174,
        weightKg: 58,
        dressSize: 'UK 8',
        shoeSize: 'UK 6',
        bustCm: 86,
        waistCm: 64,
        hipCm: 90,
        hairColour: 'Blonde',
        eyeColour: 'Blue',
        skinTone: 'light',
      },
      skills: [
        { skillType: 'language', skillValue: 'English (native)' },
        { skillType: 'special_skill', skillValue: 'Yoga (200hr RYT)' },
        { skillType: 'special_skill', skillValue: 'Trail running' },
      ],
      portfolio: [
        { caption: 'Lifestyle test shoot — Holyrood Park', isPrimary: true },
        { caption: 'Activewear — Sweaty Betty submission' },
        { caption: 'Wellness brand campaign — Aether' },
      ],
    },
    admin.id,
  )

  // ── ARTISTS — PENDING (waiting on admin review) ──────────────────────────
  await ensureArtist({
    key: 'charlie',
    email: 'pending1@castflow.test',
    name: 'Charlie Reed',
    firstName: 'Charlie',
    lastName: 'Reed',
    artistType: 'actor',
    gender: 'non-binary',
    pronouns: 'they/them',
    city: 'London',
    bio: 'Recent drama school graduate (Mountview, 2025). Looking for first professional credits in TV, commercial, and short film. Equity provisional.',
    dob: yearsAgo(24),
    experienceLevel: 'new_face',
    approvalStatus: 'pending',
    actorStats: {
      heightCm: 175,
      hairColour: 'Auburn',
      eyeColour: 'Green',
      equityMember: false,
      ageRangeMin: 20,
      ageRangeMax: 30,
    },
    skills: [
      { skillType: 'accent', skillValue: 'RP' },
      { skillType: 'accent', skillValue: 'Estuary' },
      { skillType: 'training', skillValue: 'Mountview — BA Acting (2025)' },
    ],
    portfolio: [{ caption: 'Headshot — colour 2026', isPrimary: true }],
  })

  await ensureArtist({
    key: 'olivia',
    email: 'pending2@castflow.test',
    name: 'Olivia Bennett',
    firstName: 'Olivia',
    lastName: 'Bennett',
    artistType: 'model',
    gender: 'female',
    pronouns: 'she/her',
    city: 'Birmingham',
    bio: 'Aspiring fashion model. Just turned 18. Submitted full application; awaiting verification.',
    dob: yearsAgo(18),
    experienceLevel: 'new_face',
    approvalStatus: 'pending',
    modelStats: {
      heightCm: 176,
      dressSize: 'UK 8',
      shoeSize: 'UK 7',
      hairColour: 'Brown',
      eyeColour: 'Brown',
      skinTone: 'medium',
    },
    skills: [{ skillType: 'special_skill', skillValue: 'Ballet (Grade 8)' }],
    portfolio: [
      { caption: 'Polaroid front', isPrimary: true },
      { caption: 'Polaroid side' },
    ],
  })

  console.info('✓ users + profiles')

  // ── JOBS ────────────────────────────────────────────────────────────────
  const jobSpring = await upsertJob({
    key: 'spring-campaign',
    casterId: acme.id,
    title: 'Spring/Summer 2026 Fashion Campaign — Lead Model',
    description:
      'Casting one lead female model for our Spring/Summer 2026 hero campaign. Two-day shoot in central London, full hair/makeup and styling. Looking for editorial poise with warmth — natural beauty over high-fashion austerity. Final imagery for global press, OOH, and digital.',
    category: 'model',
    subcategory: 'fashion',
    status: 'active',
    genderRequired: 'female',
    ageMin: 22,
    ageMax: 30,
    locationCity: 'London',
    skillsRequired: ['catwalk', 'editorial'],
    shootDate: daysFromNow(28),
    shootDurationHours: 16,
    callTime: daysFromNow(28),
    paymentType: 'fixed',
    rateSetBy: 'caster',
    rateAmount: 2400,
    usageRights: 'Global, 18 months, all media including OOH and broadcast.',
    headcountRequired: 1,
    applicationDeadline: daysFromNow(7),
  })

  const jobAudiobook = await upsertJob({
    key: 'audiobook-vo',
    casterId: acme.id,
    title: 'Audiobook narration — contemporary literary fiction',
    description:
      'Narrator wanted for a debut novel (88,000 words, ~10 hours finished audio). Warm baritone, capable of subtle character delineation. Home-studio recording, broadcast quality. Files delivered weekly.',
    category: 'voiceover',
    status: 'active',
    genderRequired: 'male',
    locationCity: 'Remote',
    skillsRequired: ['home-studio', 'audiobook'],
    shootDate: daysFromNow(14),
    shootDurationHours: 40,
    paymentType: 'hourly',
    rateSetBy: 'caster',
    rateAmount: 85,
    usageRights: 'Audible exclusive — 7 year licence.',
    applicationDeadline: daysFromNow(5),
  })

  const jobEditorial = await upsertJob({
    key: 'editorial',
    casterId: acme.id,
    title: 'Editorial — autumn lookbook (FILLED)',
    description:
      'Lookbook editorial featuring 12 transitional autumn outfits. One full studio day. Already cast — left up for reference.',
    category: 'model',
    status: 'filled',
    genderRequired: 'female',
    locationCity: 'London',
    shootDate: daysFromNow(10),
    shootDurationHours: 8,
    paymentType: 'fixed',
    rateSetBy: 'caster',
    rateAmount: 950,
    usageRights: 'Editorial only — UK, 12 months.',
    headcountRequired: 1,
    headcountFilled: 1,
    applicationDeadline: daysAgo(2),
  })

  await upsertJob({
    key: 'last-month',
    casterId: acme.id,
    title: 'Catalogue shoot — Autumn drop (expired)',
    description: 'Wholesale catalogue shoot. Deadline passed, no suitable bids.',
    category: 'model',
    status: 'expired',
    genderRequired: 'any',
    locationCity: 'London',
    shootDate: daysAgo(7),
    shootDurationHours: 6,
    paymentType: 'fixed',
    rateSetBy: 'caster',
    rateAmount: 600,
    usageRights: 'Wholesale catalogue, UK only.',
    applicationDeadline: daysAgo(14),
    autoExpiresAt: daysAgo(14),
  })

  await upsertJob({
    key: 'draft',
    casterId: acme.id,
    title: 'Internal brief — Winter campaign (DRAFT)',
    description: 'Draft only — not yet visible to artists.',
    category: 'model',
    status: 'draft',
    visibility: 'public',
    genderRequired: 'female',
    locationCity: 'London',
    shootDate: daysFromNow(60),
    shootDurationHours: 12,
    paymentType: 'fixed',
    rateSetBy: 'caster',
    rateAmount: 1800,
    usageRights: 'Global, 12 months.',
    applicationDeadline: daysFromNow(30),
  })

  const jobCommercial = await upsertJob({
    key: 'commercial',
    casterId: goldsmith.id,
    title: 'National TV commercial — supermarket family',
    description:
      'Casting a "father" type for a national TV commercial for a UK supermarket. 35-50, warm, relatable. Two-day shoot in Manchester. Buyout included.',
    category: 'actor',
    status: 'active',
    genderRequired: 'male',
    ageMin: 35,
    ageMax: 50,
    locationCity: 'Manchester',
    shootDate: daysFromNow(21),
    shootDurationHours: 18,
    paymentType: 'hourly',
    rateSetBy: 'caster',
    rateAmount: 100,
    requiresNda: true,
    usageRights: 'UK + Ireland TV + digital, 18 months. Buyout £4,000.',
    applicationDeadline: daysFromNow(6),
  })

  const jobInviteOnly = await upsertJob({
    key: 'private-ambassador',
    casterId: goldsmith.id,
    title: 'Brand ambassador — luxury fragrance (invite only)',
    description:
      'Long-term brand ambassador for an undisclosed luxury fragrance house. Three-year contract, six shoot days per year. Restricted to invited artists only — strict NDA required before more details are released.',
    category: 'model',
    status: 'active',
    visibility: 'invite_only',
    genderRequired: 'female',
    ageMin: 25,
    ageMax: 35,
    locationCity: 'London',
    shootDate: daysFromNow(45),
    shootDurationHours: 8,
    paymentType: 'fixed',
    rateSetBy: 'caster',
    rateAmount: 12000,
    requiresNda: true,
    exclusivity: true,
    usageRights: 'Global, exclusive, 36 months.',
    applicationDeadline: daysFromNow(14),
  })

  const jobOpen = await upsertJob({
    key: 'open-rate',
    casterId: goldsmith.id,
    title: 'Lookbook shoot — open rate, propose your fee',
    description:
      'Casting one model for an independent fashion label lookbook. Open to budget — propose your day rate in your bid. Looking for personality more than a specific look.',
    category: 'model',
    status: 'active',
    genderRequired: 'any',
    locationCity: 'London',
    shootDate: daysFromNow(35),
    shootDurationHours: 8,
    paymentType: 'fixed',
    rateSetBy: 'open',
    usageRights: 'Editorial + e-commerce, 12 months.',
    applicationDeadline: daysFromNow(10),
  })

  console.info('✓ jobs')

  // ── BIDS ───────────────────────────────────────────────────────────────
  await upsertBid({
    jobKey: 'spring-campaign',
    artistKey: 'sophie',
    jobId: jobSpring.id,
    artistId: sophie.id,
    proposedRate: 2400,
    coverNote:
      'I have shot two Burberry campaigns in the last twelve months and led a similar SS campaign for Reiss. Comfortable on a two-day editorial schedule, full availability across the proposed window.',
    status: 'shortlisted',
    submittedAt: daysAgo(3),
  })
  await upsertBid({
    jobKey: 'spring-campaign',
    artistKey: 'priya',
    jobId: jobSpring.id,
    artistId: priya.id,
    proposedRate: 2400,
    coverNote:
      'I would love to bring a fresh, body-positive angle to your spring campaign. Recent work with ASOS Curve aligns directly with the warmth-over-austerity brief.',
    status: 'pending',
    submittedAt: daysAgo(2),
  })
  await upsertBid({
    jobKey: 'spring-campaign',
    artistKey: 'emma',
    jobId: jobSpring.id,
    artistId: emma.id,
    proposedRate: 2400,
    coverNote: 'New-face but very keen — would love to learn from your team.',
    status: 'rejected',
    rejectionReason: 'Looking for more campaign experience for this brief.',
    submittedAt: daysAgo(4),
  })

  await upsertBid({
    jobKey: 'audiobook-vo',
    artistKey: 'marcus',
    jobId: jobAudiobook.id,
    artistId: marcus.id,
    proposedRate: 85,
    estimatedHours: 40,
    coverNote:
      'Twelve years of audiobook work, broadcast-quality home studio, fully Source-Connect ready. Happy to record a sample chapter at no cost.',
    status: 'pending',
    submittedAt: daysAgo(1),
  })
  await upsertBid({
    jobKey: 'audiobook-vo',
    artistKey: 'james',
    jobId: jobAudiobook.id,
    artistId: james.id,
    proposedRate: 95,
    estimatedHours: 38,
    coverNote: 'Theatre and TV credits, recent Audible narration available on request.',
    status: 'pending',
    submittedAt: daysAgo(1),
  })

  await upsertBid({
    jobKey: 'editorial',
    artistKey: 'sophie',
    jobId: jobEditorial.id,
    artistId: sophie.id,
    proposedRate: 950,
    coverNote: 'Available and excited for the autumn lookbook.',
    status: 'accepted',
    submittedAt: daysAgo(20),
  })

  await upsertBid({
    jobKey: 'commercial',
    artistKey: 'james',
    jobId: jobCommercial.id,
    artistId: james.id,
    proposedRate: 100,
    estimatedHours: 18,
    coverNote:
      "Father-of-two myself, recent supermarket-adjacent credit on a Sainsbury's Christmas spot. Buyout terms work for me as proposed.",
    status: 'pending',
    submittedAt: daysAgo(2),
  })
  await upsertBid({
    jobKey: 'commercial',
    artistKey: 'marcus',
    jobId: jobCommercial.id,
    artistId: marcus.id,
    proposedRate: 110,
    estimatedHours: 18,
    coverNote: 'On reflection I am over-committed in that window — withdrawing.',
    status: 'withdrawn',
    submittedAt: daysAgo(3),
  })

  await upsertBid({
    jobKey: 'private-ambassador',
    artistKey: 'sophie',
    jobId: jobInviteOnly.id,
    artistId: sophie.id,
    proposedRate: 12000,
    coverNote: 'NDA signed and returned. Excited to discuss the campaign in detail.',
    status: 'pending',
    submittedAt: daysAgo(1),
  })

  await upsertBid({
    jobKey: 'open-rate',
    artistKey: 'sophie',
    jobId: jobOpen.id,
    artistId: sophie.id,
    proposedRate: 1200,
    coverNote: 'Proposing £1,200 for the day given exclusive period is short.',
    status: 'pending',
    submittedAt: daysAgo(1),
  })
  await upsertBid({
    jobKey: 'open-rate',
    artistKey: 'priya',
    jobId: jobOpen.id,
    artistId: priya.id,
    proposedRate: 950,
    coverNote: 'Happy to offer £950 — building portfolio with independent labels.',
    status: 'pending',
    submittedAt: daysAgo(2),
  })
  await upsertBid({
    jobKey: 'open-rate',
    artistKey: 'emma',
    jobId: jobOpen.id,
    artistId: emma.id,
    proposedRate: 700,
    coverNote: 'Newer face — £700 reflects where I am in my career.',
    status: 'pending',
    submittedAt: daysAgo(1),
  })

  console.info('✓ bids')

  // ── JOB INVITES ────────────────────────────────────────────────────────
  await prisma.jobInvite.upsert({
    where: { id: ID.invite('private-ambassador', 'sophie') },
    create: {
      id: ID.invite('private-ambassador', 'sophie'),
      jobId: jobInviteOnly.id,
      artistId: sophie.id,
      message:
        'Sophie — we think you would be perfect for this. NDA attached. Please review and let us know.',
      status: 'accepted',
      createdAt: daysAgo(4),
    },
    update: { status: 'accepted' },
  })
  await prisma.jobInvite.upsert({
    where: { id: ID.invite('private-ambassador', 'priya') },
    create: {
      id: ID.invite('private-ambassador', 'priya'),
      jobId: jobInviteOnly.id,
      artistId: priya.id,
      message: 'Inviting you to consider this — would love your perspective.',
      status: 'pending',
      createdAt: daysAgo(1),
    },
    update: { status: 'pending' },
  })
  await prisma.jobInvite.upsert({
    where: { id: ID.invite('audiobook-vo', 'james') },
    create: {
      id: ID.invite('audiobook-vo', 'james'),
      jobId: jobAudiobook.id,
      artistId: james.id,
      message: 'James — voice would suit this perfectly.',
      status: 'declined',
      createdAt: daysAgo(3),
    },
    update: { status: 'declined' },
  })

  // ── BOOKINGS + CONTRACTS + PAYMENTS ────────────────────────────────────
  const editorialBid = await prisma.bid.findUnique({
    where: { id: ID.bid('editorial', 'sophie') },
  })
  if (!editorialBid) throw new Error('expected editorial bid to exist')

  const editorialBooking = await prisma.booking.upsert({
    where: { id: ID.booking('editorial-sophie') },
    create: {
      id: ID.booking('editorial-sophie'),
      jobId: jobEditorial.id,
      bidId: editorialBid.id,
      casterId: acme.id,
      artistId: sophie.id,
      paymentType: 'fixed',
      agreedRate: new Prisma.Decimal(950),
      totalAmount: new Prisma.Decimal(950),
      shootDate: daysFromNow(10),
      shootLocation: 'Acme Studios, 12 Marylebone Lane, London W1U 2DJ',
      status: 'confirmed',
    },
    update: { status: 'confirmed' },
  })

  await prisma.contract.upsert({
    where: { bookingId: editorialBooking.id },
    create: {
      id: ID.contract('editorial'),
      bookingId: editorialBooking.id,
      status: 'fully_signed',
      artistLegalName: 'Sophie Anne Carter',
      casterCompanyName: 'Acme Studios London Ltd',
      jobTitle: jobEditorial.title,
      shootDate: editorialBooking.shootDate,
      shootLocation: editorialBooking.shootLocation,
      paymentType: 'fixed',
      agreedRate: new Prisma.Decimal(950),
      totalAmount: new Prisma.Decimal(950),
      paymentTerms: '£950 flat fee, held in escrow, released within 48h of shoot completion.',
      usageRights: jobEditorial.usageRights,
      exclusivity: false,
      ndaIncluded: false,
      artistSigned: true,
      artistSignedAt: daysAgo(5),
      artistSignatureStr: 'Sophie Anne Carter',
      casterSigned: true,
      casterSignedAt: daysAgo(4),
      casterSignatureStr: 'Hannah Lloyd',
      pdfUrl: 'seed/contracts/editorial-sophie.pdf',
    },
    update: { status: 'fully_signed' },
  })

  await prisma.payment.upsert({
    where: { bookingId: editorialBooking.id },
    create: {
      id: ID.payment('editorial'),
      bookingId: editorialBooking.id,
      stripePaymentIntentId: 'pi_seed_editorial',
      stripeChargeId: 'ch_seed_editorial',
      grossAmount: new Prisma.Decimal(950),
      platformCommissionRate: new Prisma.Decimal(COMMISSION_RATE),
      platformCommissionAmount: new Prisma.Decimal(142.5),
      netArtistAmount: new Prisma.Decimal(807.5),
      escrowStatus: 'held',
      paidAt: daysAgo(4),
      autoReleaseAt: daysFromNow(12),
    },
    update: { escrowStatus: 'held' },
  })

  // Completed booking — drives the reviews
  const jobHistory = await upsertJob({
    key: 'history-summer',
    casterId: acme.id,
    title: 'Summer 2025 lookbook — completed (historical)',
    description: 'Completed shoot — kept for review history.',
    category: 'model',
    status: 'closed',
    genderRequired: 'female',
    locationCity: 'London',
    shootDate: daysAgo(45),
    shootDurationHours: 8,
    paymentType: 'fixed',
    rateSetBy: 'caster',
    rateAmount: 800,
    usageRights: 'Editorial + e-commerce, 12 months.',
    headcountRequired: 1,
    headcountFilled: 1,
    applicationDeadline: daysAgo(60),
    autoExpiresAt: daysAgo(60),
  })
  const historyBid = await upsertBid({
    jobKey: 'history-summer',
    artistKey: 'sophie',
    jobId: jobHistory.id,
    artistId: sophie.id,
    proposedRate: 800,
    coverNote: 'Booked.',
    status: 'accepted',
    submittedAt: daysAgo(60),
  })

  const completedBooking = await prisma.booking.upsert({
    where: { id: ID.booking('history-summer') },
    create: {
      id: ID.booking('history-summer'),
      jobId: jobHistory.id,
      bidId: historyBid.id,
      casterId: acme.id,
      artistId: sophie.id,
      paymentType: 'fixed',
      agreedRate: new Prisma.Decimal(800),
      totalAmount: new Prisma.Decimal(800),
      shootDate: daysAgo(45),
      shootLocation: 'Acme Studios, 12 Marylebone Lane, London W1U 2DJ',
      status: 'completed',
      completionConfirmedAt: daysAgo(44),
    },
    update: { status: 'completed' },
  })

  await prisma.contract.upsert({
    where: { bookingId: completedBooking.id },
    create: {
      id: ID.contract('history-summer'),
      bookingId: completedBooking.id,
      status: 'fully_signed',
      artistLegalName: 'Sophie Anne Carter',
      casterCompanyName: 'Acme Studios London Ltd',
      jobTitle: jobHistory.title,
      shootDate: completedBooking.shootDate,
      shootLocation: completedBooking.shootLocation,
      paymentType: 'fixed',
      agreedRate: new Prisma.Decimal(800),
      totalAmount: new Prisma.Decimal(800),
      paymentTerms: '£800 flat fee.',
      usageRights: jobHistory.usageRights,
      exclusivity: false,
      ndaIncluded: false,
      artistSigned: true,
      artistSignedAt: daysAgo(55),
      artistSignatureStr: 'Sophie Anne Carter',
      casterSigned: true,
      casterSignedAt: daysAgo(54),
      casterSignatureStr: 'Hannah Lloyd',
      pdfUrl: 'seed/contracts/history-summer.pdf',
    },
    update: { status: 'fully_signed' },
  })

  await prisma.payment.upsert({
    where: { bookingId: completedBooking.id },
    create: {
      id: ID.payment('history-summer'),
      bookingId: completedBooking.id,
      stripePaymentIntentId: 'pi_seed_history',
      stripeChargeId: 'ch_seed_history',
      stripeTransferId: 'tr_seed_history',
      grossAmount: new Prisma.Decimal(800),
      platformCommissionRate: new Prisma.Decimal(COMMISSION_RATE),
      platformCommissionAmount: new Prisma.Decimal(120),
      netArtistAmount: new Prisma.Decimal(680),
      escrowStatus: 'released',
      paidAt: daysAgo(60),
      releasedAt: daysAgo(43),
      autoReleaseAt: daysAgo(43),
    },
    update: { escrowStatus: 'released' },
  })

  // Pending-payment booking
  const jobPendingPay = await upsertJob({
    key: 'pending-payment-shoot',
    casterId: goldsmith.id,
    title: 'Catalogue half-day — awaiting payment',
    description: 'Booking accepted, caster yet to pay escrow.',
    category: 'model',
    status: 'filled',
    genderRequired: 'female',
    locationCity: 'London',
    shootDate: daysFromNow(20),
    shootDurationHours: 4,
    paymentType: 'fixed',
    rateSetBy: 'caster',
    rateAmount: 450,
    usageRights: 'Catalogue, UK, 12 months.',
    headcountRequired: 1,
    headcountFilled: 1,
    applicationDeadline: daysAgo(1),
  })
  const pendingBid = await upsertBid({
    jobKey: 'pending-payment-shoot',
    artistKey: 'emma',
    jobId: jobPendingPay.id,
    artistId: emma.id,
    proposedRate: 450,
    coverNote: 'Available, excited.',
    status: 'accepted',
    submittedAt: daysAgo(3),
  })
  await prisma.booking.upsert({
    where: { id: ID.booking('pending-pay') },
    create: {
      id: ID.booking('pending-pay'),
      jobId: jobPendingPay.id,
      bidId: pendingBid.id,
      casterId: goldsmith.id,
      artistId: emma.id,
      paymentType: 'fixed',
      agreedRate: new Prisma.Decimal(450),
      totalAmount: new Prisma.Decimal(450),
      shootDate: daysFromNow(20),
      shootLocation: 'Goldsmith HQ, 88 Wardour Street, London W1F 0TH',
      status: 'pending_payment',
    },
    update: { status: 'pending_payment' },
  })

  // Cancelled booking with cancellation fee applied
  const jobCancelled = await upsertJob({
    key: 'cancelled-job',
    casterId: goldsmith.id,
    title: 'Cancelled shoot — half-day commercial',
    description: 'Caster cancelled under 48h, fee applied.',
    category: 'model',
    status: 'cancelled',
    genderRequired: 'female',
    locationCity: 'London',
    shootDate: daysAgo(10),
    shootDurationHours: 4,
    paymentType: 'fixed',
    rateSetBy: 'caster',
    rateAmount: 700,
    usageRights: 'Commercial, UK, 12 months.',
    applicationDeadline: daysAgo(25),
    autoExpiresAt: daysAgo(25),
  })
  const cancelledBid = await upsertBid({
    jobKey: 'cancelled-job',
    artistKey: 'priya',
    jobId: jobCancelled.id,
    artistId: priya.id,
    proposedRate: 700,
    coverNote: 'Booked.',
    status: 'accepted',
    submittedAt: daysAgo(20),
  })
  const cancelledBooking = await prisma.booking.upsert({
    where: { id: ID.booking('cancelled') },
    create: {
      id: ID.booking('cancelled'),
      jobId: jobCancelled.id,
      bidId: cancelledBid.id,
      casterId: goldsmith.id,
      artistId: priya.id,
      paymentType: 'fixed',
      agreedRate: new Prisma.Decimal(700),
      totalAmount: new Prisma.Decimal(700),
      shootDate: daysAgo(10),
      shootLocation: 'Goldsmith HQ, 88 Wardour Street, London W1F 0TH',
      status: 'cancelled',
      cancelledBy: 'caster',
      cancelledAt: daysAgo(11),
      cancellationReason: 'Brand pulled the campaign at short notice.',
    },
    update: { status: 'cancelled' },
  })
  await prisma.payment.upsert({
    where: { bookingId: cancelledBooking.id },
    create: {
      id: ID.payment('cancelled'),
      bookingId: cancelledBooking.id,
      stripePaymentIntentId: 'pi_seed_cancelled',
      stripeChargeId: 'ch_seed_cancelled',
      grossAmount: new Prisma.Decimal(700),
      platformCommissionRate: new Prisma.Decimal(COMMISSION_RATE),
      platformCommissionAmount: new Prisma.Decimal(105),
      netArtistAmount: new Prisma.Decimal(595),
      escrowStatus: 'partially_refunded',
      cancellationFeeAmount: new Prisma.Decimal(350),
      paidAt: daysAgo(15),
      releasedAt: daysAgo(9),
      refundedAt: daysAgo(9),
      autoReleaseAt: daysAgo(8),
    },
    update: { escrowStatus: 'partially_refunded' },
  })

  // Disputed booking
  const jobDisputed = await upsertJob({
    key: 'disputed-job',
    casterId: goldsmith.id,
    title: 'Disputed shoot — completion contested',
    description: 'Caster says the artist no-showed the second half; artist disputes.',
    category: 'model',
    status: 'closed',
    genderRequired: 'any',
    locationCity: 'London',
    shootDate: daysAgo(5),
    shootDurationHours: 8,
    paymentType: 'fixed',
    rateSetBy: 'caster',
    rateAmount: 1200,
    usageRights: 'Campaign, UK, 12 months.',
    applicationDeadline: daysAgo(20),
    autoExpiresAt: daysAgo(20),
  })
  const disputedBid = await upsertBid({
    jobKey: 'disputed-job',
    artistKey: 'james',
    jobId: jobDisputed.id,
    artistId: james.id,
    proposedRate: 1200,
    coverNote: 'Booked.',
    status: 'accepted',
    submittedAt: daysAgo(18),
  })
  const disputedBooking = await prisma.booking.upsert({
    where: { id: ID.booking('disputed') },
    create: {
      id: ID.booking('disputed'),
      jobId: jobDisputed.id,
      bidId: disputedBid.id,
      casterId: goldsmith.id,
      artistId: james.id,
      paymentType: 'fixed',
      agreedRate: new Prisma.Decimal(1200),
      totalAmount: new Prisma.Decimal(1200),
      shootDate: daysAgo(5),
      shootLocation: 'Goldsmith HQ, 88 Wardour Street, London W1F 0TH',
      status: 'disputed',
    },
    update: { status: 'disputed' },
  })
  await prisma.contract.upsert({
    where: { bookingId: disputedBooking.id },
    create: {
      id: ID.contract('disputed'),
      bookingId: disputedBooking.id,
      status: 'fully_signed',
      artistLegalName: "James O'Hara",
      casterCompanyName: 'Goldsmith Casting Agency Ltd',
      jobTitle: jobDisputed.title,
      shootDate: disputedBooking.shootDate,
      shootLocation: disputedBooking.shootLocation,
      paymentType: 'fixed',
      agreedRate: new Prisma.Decimal(1200),
      totalAmount: new Prisma.Decimal(1200),
      paymentTerms: '£1,200 flat fee.',
      usageRights: jobDisputed.usageRights,
      exclusivity: false,
      ndaIncluded: false,
      artistSigned: true,
      artistSignedAt: daysAgo(15),
      artistSignatureStr: "James O'Hara",
      casterSigned: true,
      casterSignedAt: daysAgo(14),
      casterSignatureStr: 'Marcus Goldsmith',
    },
    update: { status: 'fully_signed' },
  })
  await prisma.payment.upsert({
    where: { bookingId: disputedBooking.id },
    create: {
      id: ID.payment('disputed'),
      bookingId: disputedBooking.id,
      stripePaymentIntentId: 'pi_seed_disputed',
      stripeChargeId: 'ch_seed_disputed',
      grossAmount: new Prisma.Decimal(1200),
      platformCommissionRate: new Prisma.Decimal(COMMISSION_RATE),
      platformCommissionAmount: new Prisma.Decimal(180),
      netArtistAmount: new Prisma.Decimal(1020),
      escrowStatus: 'disputed',
      paidAt: daysAgo(15),
      autoReleaseAt: daysAgo(3),
    },
    update: { escrowStatus: 'disputed' },
  })
  await prisma.dispute.upsert({
    where: { bookingId: disputedBooking.id },
    create: {
      id: ID.dispute('main'),
      bookingId: disputedBooking.id,
      raisedById: goldsmithUser.id,
      raisedAgainstId: jamesUser.id,
      reason: 'Partial no-show',
      description:
        'Artist left set after first three hours despite the booking covering the full day. Brand had to reshoot afternoon scenes with a stand-in.',
      casterSubmission:
        'Call sheet shows 9am–5pm. Artist left at 12:15pm citing illness — no doctor note. Brand had to extend studio hire and recast PM scenes.',
      casterSubmittedAt: daysAgo(4),
      artistSubmission:
        'I notified the caster at 11:30 that I was unwell. Stayed past my comfort to finish AM scenes. Have a GP note dated same day, attached separately.',
      artistSubmittedAt: daysAgo(3),
      status: 'under_review',
      createdAt: daysAgo(4),
    },
    update: { status: 'under_review' },
  })

  console.info('✓ bookings, contracts, payments, disputes')

  // ── REVIEWS ────────────────────────────────────────────────────────────
  await prisma.review.upsert({
    where: { id: ID.review('history-summer', 'caster') },
    create: {
      id: ID.review('history-summer', 'caster'),
      bookingId: completedBooking.id,
      reviewerId: acmeUser.id,
      reviewerRole: 'caster',
      artistRevieweeId: sophie.id,
      rating: 5,
      comment:
        'Sophie was a dream on set — totally prepared, took direction beautifully, and elevated every look. Already in pre-prod on her next campaign with us.',
      createdAt: daysAgo(40),
    },
    update: { rating: 5 },
  })
  await prisma.review.upsert({
    where: { id: ID.review('history-summer', 'artist') },
    create: {
      id: ID.review('history-summer', 'artist'),
      bookingId: completedBooking.id,
      reviewerId: sophieUser.id,
      reviewerRole: 'artist',
      casterRevieweeId: acme.id,
      rating: 5,
      comment:
        'Acme run a properly professional set — call sheet on time, hair/makeup brilliant, payment landed exactly when they said it would.',
      createdAt: daysAgo(40),
    },
    update: { rating: 5 },
  })

  console.info('✓ reviews')

  // ── MESSAGE THREADS + MESSAGES ─────────────────────────────────────────
  const thread1 = await prisma.messageThread.upsert({
    where: {
      jobId_casterId_artistId: {
        jobId: jobSpring.id,
        casterId: acme.id,
        artistId: sophie.id,
      },
    },
    create: {
      id: ID.thread('spring-campaign', 'sophie'),
      jobId: jobSpring.id,
      casterId: acme.id,
      artistId: sophie.id,
      unlocked: true,
      lastMessageAt: daysAgo(1),
    },
    update: { unlocked: true, lastMessageAt: daysAgo(1) },
  })

  await prisma.message.deleteMany({ where: { threadId: thread1.id } })
  await prisma.message.createMany({
    data: [
      {
        id: ID.message('spring-1'),
        threadId: thread1.id,
        senderId: acmeUser.id,
        content:
          'Hi Sophie — we have shortlisted you for the Spring/Summer campaign. Any conflicts in the proposed two-day window?',
        readAt: daysAgo(2),
        createdAt: daysAgo(2),
      },
      {
        id: ID.message('spring-2'),
        threadId: thread1.id,
        senderId: sophieUser.id,
        content: 'Hi Hannah — fully available across both days. Excited to discuss further.',
        readAt: daysAgo(2),
        createdAt: daysAgo(2),
      },
      {
        id: ID.message('spring-3'),
        threadId: thread1.id,
        senderId: acmeUser.id,
        content: 'Brilliant. I will send the call sheet draft tomorrow.',
        readAt: null,
        createdAt: daysAgo(1),
      },
    ],
  })

  await prisma.messageThread.upsert({
    where: {
      jobId_casterId_artistId: {
        jobId: jobAudiobook.id,
        casterId: acme.id,
        artistId: marcus.id,
      },
    },
    create: {
      id: ID.thread('audiobook-vo', 'marcus'),
      jobId: jobAudiobook.id,
      casterId: acme.id,
      artistId: marcus.id,
      unlocked: false,
    },
    update: { unlocked: false },
  })

  console.info('✓ message threads')

  // ── NOTIFICATIONS ──────────────────────────────────────────────────────
  await prisma.notification.deleteMany({ where: { id: { startsWith: 'nt_seed_' } } })
  await prisma.notification.createMany({
    data: [
      {
        id: ID.notif('sophie-shortlist'),
        userId: sophieUser.id,
        type: 'bid_shortlisted',
        title: 'You have been shortlisted',
        body: 'Acme Studios London shortlisted you for "Spring/Summer 2026 Fashion Campaign".',
        relatedEntityType: 'bid',
        relatedEntityId: ID.bid('spring-campaign', 'sophie'),
        createdAt: daysAgo(1),
      },
      {
        id: ID.notif('sophie-booking'),
        userId: sophieUser.id,
        type: 'booking_confirmed',
        title: 'Booking confirmed',
        body: 'Your editorial shoot with Acme is confirmed for ' + daysFromNow(10).toDateString() + '.',
        relatedEntityType: 'booking',
        relatedEntityId: editorialBooking.id,
        readAt: daysAgo(3),
        createdAt: daysAgo(4),
      },
      {
        id: ID.notif('sophie-invite'),
        userId: sophieUser.id,
        type: 'job_invite',
        title: 'New private invite',
        body: 'Goldsmith Casting Agency invited you to a private job (NDA required).',
        relatedEntityType: 'job',
        relatedEntityId: jobInviteOnly.id,
        createdAt: daysAgo(4),
      },
      {
        id: ID.notif('emma-rejected'),
        userId: emmaUser.id,
        type: 'bid_rejected',
        title: 'Bid not selected',
        body: 'Your bid on "Spring/Summer 2026 Fashion Campaign" was not selected this time.',
        relatedEntityType: 'bid',
        relatedEntityId: ID.bid('spring-campaign', 'emma'),
        createdAt: daysAgo(2),
      },
      {
        id: ID.notif('emma-pending-payment'),
        userId: emmaUser.id,
        type: 'booking_pending_payment',
        title: 'Booking awaiting payment',
        body: 'Your booking with Goldsmith Casting Agency is pending caster payment.',
        relatedEntityType: 'booking',
        relatedEntityId: ID.booking('pending-pay'),
        createdAt: daysAgo(1),
      },
      {
        id: ID.notif('acme-new-bid'),
        userId: acmeUser.id,
        type: 'new_bid',
        title: 'New bid received',
        body: 'Priya Patel submitted a bid on "Spring/Summer 2026 Fashion Campaign".',
        relatedEntityType: 'bid',
        relatedEntityId: ID.bid('spring-campaign', 'priya'),
        createdAt: daysAgo(2),
      },
      {
        id: ID.notif('james-bid-pending'),
        userId: jamesUser.id,
        type: 'bid_submitted',
        title: 'Bid submitted',
        body: 'You bid on "National TV commercial — supermarket family". Caster will respond shortly.',
        relatedEntityType: 'bid',
        relatedEntityId: ID.bid('commercial', 'james'),
        readAt: daysAgo(1),
        createdAt: daysAgo(2),
      },
      {
        id: ID.notif('james-dispute'),
        userId: jamesUser.id,
        type: 'dispute_opened',
        title: 'A dispute has been opened',
        body: 'Goldsmith Casting Agency opened a dispute on your recent booking.',
        relatedEntityType: 'dispute',
        relatedEntityId: ID.dispute('main'),
        createdAt: daysAgo(4),
      },
      {
        id: ID.notif('admin-pending-review'),
        userId: admin.id,
        type: 'approval_pending',
        title: 'New artist applications',
        body: '2 artists are waiting for approval review.',
        createdAt: daysAgo(1),
      },
    ],
  })

  console.info('✓ notifications')

  // ── ADMIN LOGS ────────────────────────────────────────────────────────
  await prisma.adminLog.deleteMany({ where: { id: { startsWith: 'lg_seed_' } } })
  await prisma.adminLog.createMany({
    data: [
      {
        id: ID.log('approve-sophie'),
        adminId: admin.id,
        action: 'artist_approved',
        entityType: 'artist_profile',
        entityId: sophie.id,
        notes: 'ID verified, portfolio reviewed, age confirmed 18+.',
        createdAt: daysAgo(30),
      },
      {
        id: ID.log('approve-james'),
        adminId: admin.id,
        action: 'artist_approved',
        entityType: 'artist_profile',
        entityId: james.id,
        notes: 'Equity card verified, Spotlight profile cross-checked.',
        createdAt: daysAgo(28),
      },
    ],
  })

  // ─── Summary ────────────────────────────────────────────────────────────
  console.info('')
  console.info('✅ Seed complete')
  console.info('')
  console.info('Login credentials (password for ALL accounts: Password123!)')
  console.info('─────────────────────────────────────────────────────────────')
  console.info('Admin       admin@castflow.test       Ada Admin')
  console.info('Caster #1   caster1@castflow.test     Acme Studios London (brand)')
  console.info('Caster #2   caster2@castflow.test     Goldsmith Casting Agency (agency)')
  console.info('Artist #1   artist1@castflow.test     Sophie Carter   — model, approved, payouts on')
  console.info("Artist #2   artist2@castflow.test     James O'Hara    — actor, approved, payouts on")
  console.info('Artist #3   artist3@castflow.test     Priya Patel     — model, approved')
  console.info('Artist #4   artist4@castflow.test     Marcus Thompson — actor, approved, payouts on')
  console.info('Artist #5   artist5@castflow.test     Emma Wilson     — model, approved')
  console.info('Pending #1  pending1@castflow.test    Charlie Reed    — awaiting admin approval')
  console.info('Pending #2  pending2@castflow.test    Olivia Bennett  — awaiting admin approval')
  console.info('')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })
