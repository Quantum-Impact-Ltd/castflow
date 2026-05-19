/**
 * Mock data for the public shoots feed.
 *
 * Shape matches the public-feed response of `GET /jobs` — visible-only fields
 * (no `shootLocationDetail`, no internal status). Replace with `useJobs(filters)`
 * once the backend public feed endpoint is live.
 */

import type { Job, CasterProfile } from '@castflow/types'

type PublicJob = Pick<
  Job,
  | 'id'
  | 'casterId'
  | 'title'
  | 'description'
  | 'category'
  | 'subcategory'
  | 'visibility'
  | 'status'
  | 'genderRequired'
  | 'ageMin'
  | 'ageMax'
  | 'locationCity'
  | 'skillsRequired'
  | 'shootDate'
  | 'shootEndDate'
  | 'shootDurationHours'
  | 'paymentType'
  | 'rateSetBy'
  | 'rateAmount'
  | 'requiresNda'
  | 'exclusivity'
  | 'usageRights'
  | 'headcountRequired'
  | 'headcountFilled'
  | 'applicationDeadline'
  | 'createdAt'
> & {
  caster: Pick<CasterProfile, 'id' | 'companyName'>
  /** Mock-only: hero image for card. Backend would derive from `coverImageUrl` on Job. */
  imageUrl: string
}

export type { PublicJob }

export interface CasterMeta {
  verified: boolean
  shootsPosted: number
  rating: number
  ratingCount: number
  memberSince: string
}

export interface ShootDetailExtras {
  /** Locked detail — only revealed after the artist signs in + bid is accepted. */
  shootLocationDetail: string
  callTime: string
  wardrobe: string
  perks: string[]
  cancellationPolicy: string
  similarShootIds: string[]
  casterMeta: CasterMeta
}

const SHOOT_DETAIL_EXTRAS: Record<string, ShootDetailExtras> = {
  'shoot-001': {
    shootLocationDetail: 'Studio at 14 Cremer Street, London E2 8HD',
    callTime: '08:00 hair & makeup · 09:30 first frame',
    wardrobe: 'Provided on set. Bring nude underwear + skin-tone strapless bra.',
    perks: ['Hair & makeup provided', 'Catering on set', 'Travel reimbursed within M25'],
    cancellationPolicy: '48hr standard · 50% fee if cancelled inside 48h of call time',
    similarShootIds: ['shoot-004', 'shoot-008', 'shoot-006'],
    casterMeta: {
      verified: true,
      shootsPosted: 47,
      rating: 4.9,
      ratingCount: 38,
      memberSince: '2024',
    },
  },
  'shoot-002': {
    shootLocationDetail: 'Remote · home studio recording',
    callTime: 'Flexible — submit dry run within 5 working days',
    wardrobe: 'N/A — voiceover',
    perks: ['Remote', 'Two revision rounds included', 'Direct line to creative director'],
    cancellationPolicy: '24hr standard',
    similarShootIds: ['shoot-005'],
    casterMeta: {
      verified: true,
      shootsPosted: 12,
      rating: 4.7,
      ratingCount: 9,
      memberSince: '2025',
    },
  },
  'shoot-003': {
    shootLocationDetail: 'Studio TBC, central Manchester (within 1 mile of Piccadilly)',
    callTime: '07:00 call · 08:30 first frame',
    wardrobe: 'Stylist provided. Bring black socks + nude underwear.',
    perks: ['Catering', 'Stylist on set', 'Buyout included'],
    cancellationPolicy: '72hr standard · TVC standard ESA scale fees',
    similarShootIds: ['shoot-009'],
    casterMeta: {
      verified: true,
      shootsPosted: 124,
      rating: 4.8,
      ratingCount: 96,
      memberSince: '2023',
    },
  },
  'shoot-004': {
    shootLocationDetail: 'Wapping Wharf warehouse, Bristol BS1 6WP',
    callTime: '09:30 H&MU · 11:00 first frame',
    wardrobe: 'All provided',
    perks: ['Catering', 'Local travel covered'],
    cancellationPolicy: '48hr standard',
    similarShootIds: ['shoot-001', 'shoot-008'],
    casterMeta: {
      verified: true,
      shootsPosted: 31,
      rating: 4.85,
      ratingCount: 27,
      memberSince: '2024',
    },
  },
  'shoot-005': {
    shootLocationDetail: 'Remote · ACX-grade recording required',
    callTime: 'Booking dates by mutual agreement',
    wardrobe: 'N/A',
    perks: ['Royalty share on bestseller tiers', 'Flexible recording windows'],
    cancellationPolicy: '7 day notice on scheduled sessions',
    similarShootIds: ['shoot-002'],
    casterMeta: {
      verified: true,
      shootsPosted: 8,
      rating: 4.9,
      ratingCount: 6,
      memberSince: '2025',
    },
  },
  'shoot-006': {
    shootLocationDetail: 'Studio 22, Bermondsey Pickle Factory, London SE1',
    callTime: '10:30 nail prep · 11:00 first frame',
    wardrobe: 'N/A · neutral manicure provided',
    perks: ['Manicure included', 'Catering on set'],
    cancellationPolicy: '48hr standard',
    similarShootIds: ['shoot-001', 'shoot-004'],
    casterMeta: {
      verified: true,
      shootsPosted: 19,
      rating: 4.75,
      ratingCount: 14,
      memberSince: '2024',
    },
  },
  'shoot-007': {
    shootLocationDetail: 'Newhailes Estate, Musselburgh EH21',
    callTime: '05:30 unit base · 06:30 costume',
    wardrobe: 'Full period costume + makeup provided',
    perks: ['Costume & makeup', 'Catering all three days', 'Daily mileage'],
    cancellationPolicy: '72hr standard',
    similarShootIds: ['shoot-003', 'shoot-009'],
    casterMeta: {
      verified: true,
      shootsPosted: 73,
      rating: 4.6,
      ratingCount: 51,
      memberSince: '2023',
    },
  },
  'shoot-008': {
    shootLocationDetail: 'Botany Bay, Broadstairs CT10',
    callTime: '06:45 H&MU · 08:00 first frame (golden hour)',
    wardrobe: 'All provided · bring nude underwear',
    perks: ['Travel from London covered', 'Catering on set'],
    cancellationPolicy: '48hr standard · weather hold day included',
    similarShootIds: ['shoot-001', 'shoot-004'],
    casterMeta: {
      verified: true,
      shootsPosted: 22,
      rating: 4.8,
      ratingCount: 18,
      memberSince: '2024',
    },
  },
  'shoot-009': {
    shootLocationDetail: 'Various — North London, exact addresses on call sheet',
    callTime: 'Daily call sheets confirmed 48h ahead',
    wardrobe: 'Costume provided · sizing call required',
    perks: [
      'Festival submission credit',
      'Showreel footage delivered',
      'Per diem covered',
    ],
    cancellationPolicy: '72hr standard',
    similarShootIds: ['shoot-003'],
    casterMeta: {
      verified: true,
      shootsPosted: 14,
      rating: 4.95,
      ratingCount: 11,
      memberSince: '2024',
    },
  },
}

export function getMockShoot(id: string): (PublicJob & ShootDetailExtras) | null {
  const job = MOCK_SHOOTS.find((s) => s.id === id)
  if (!job) return null
  const extras = SHOOT_DETAIL_EXTRAS[id]
  if (!extras) return null
  return { ...job, ...extras }
}

export function getSimilarShoots(ids: readonly string[]): PublicJob[] {
  return ids
    .map((id) => MOCK_SHOOTS.find((s) => s.id === id))
    .filter((s): s is PublicJob => Boolean(s))
}

export const MOCK_SHOOTS: PublicJob[] = [
  {
    id: 'shoot-001',
    casterId: 'c-1',
    title: 'Female model — Summer swimwear campaign',
    description:
      'Two-day swimwear and resort campaign shooting in Camden. Editorial-leaning, natural light. Looking for ages 22–28, full-body confident.',
    category: 'model',
    subcategory: 'Fashion',
    visibility: 'public',
    status: 'active',
    genderRequired: 'female',
    ageMin: 22,
    ageMax: 28,
    locationCity: 'London',
    skillsRequired: ['Editorial', 'Swimwear', 'Movement'],
    shootDate: '2026-06-12T09:00:00.000Z',
    shootEndDate: '2026-06-13T18:00:00.000Z',
    shootDurationHours: 16,
    paymentType: 'fixed',
    rateSetBy: 'caster',
    rateAmount: 500,
    requiresNda: false,
    exclusivity: false,
    usageRights: 'Digital + print, 12 months UK',
    headcountRequired: 3,
    headcountFilled: 0,
    applicationDeadline: '2026-06-05T23:59:00.000Z',
    createdAt: '2026-05-15T10:00:00.000Z',
    imageUrl: 'https://picsum.photos/seed/swimwear-beach/1200/1500',
    caster: { id: 'c-1', companyName: 'Saunders & Co' },
  },
  {
    id: 'shoot-002',
    casterId: 'c-2',
    title: 'Voiceover actor — Tech explainer',
    description:
      'Native-quality UK accent, warm tone, 90-second explainer for a SaaS product. Remote-recorded, two rounds of revisions included.',
    category: 'voiceover',
    subcategory: 'Explainer',
    visibility: 'public',
    status: 'active',
    genderRequired: 'any',
    ageMin: null,
    ageMax: null,
    locationCity: 'Remote',
    skillsRequired: ['Voiceover', 'Home studio', 'RP accent'],
    shootDate: '2026-06-20T00:00:00.000Z',
    shootEndDate: null,
    shootDurationHours: 4,
    paymentType: 'hourly',
    rateSetBy: 'open',
    rateAmount: null,
    requiresNda: true,
    exclusivity: false,
    usageRights: 'Web + paid social, 6 months',
    headcountRequired: 1,
    headcountFilled: 0,
    applicationDeadline: '2026-06-15T23:59:00.000Z',
    createdAt: '2026-05-22T11:30:00.000Z',
    imageUrl: 'https://picsum.photos/seed/studio-microphone/1200/1500',
    caster: { id: 'c-2', companyName: 'Northbeam Labs' },
  },
  {
    id: 'shoot-003',
    casterId: 'c-3',
    title: 'TVC lead talent — Drinks brand',
    description:
      'Hero spot for premium non-alc range. Looking for charisma + comedic timing, ages 28–40. Speaking role, three lines, plus reaction shots.',
    category: 'actor',
    subcategory: 'TVC',
    visibility: 'public',
    status: 'active',
    genderRequired: 'any',
    ageMin: 28,
    ageMax: 40,
    locationCity: 'Manchester',
    skillsRequired: ['Speaking role', 'Comedy', 'Improv'],
    shootDate: '2026-06-28T07:00:00.000Z',
    shootEndDate: '2026-06-28T19:00:00.000Z',
    shootDurationHours: 8,
    paymentType: 'hourly',
    rateSetBy: 'caster',
    rateAmount: 85,
    requiresNda: true,
    exclusivity: true,
    usageRights: 'TV + digital, 12 months UK + ROI',
    headcountRequired: 2,
    headcountFilled: 1,
    applicationDeadline: '2026-06-20T23:59:00.000Z',
    createdAt: '2026-05-18T15:00:00.000Z',
    imageUrl: 'https://picsum.photos/seed/commercial-portrait/1200/1500',
    caster: { id: 'c-3', companyName: 'Hartwell Agency' },
  },
  {
    id: 'shoot-004',
    casterId: 'c-4',
    title: 'Editorial footwear — Quiet luxury',
    description:
      'Single-day editorial shooting in a converted Bristol warehouse. Quiet-luxury aesthetic, soft natural light, ages 24–34.',
    category: 'model',
    subcategory: 'Editorial',
    visibility: 'public',
    status: 'active',
    genderRequired: 'any',
    ageMin: 24,
    ageMax: 34,
    locationCity: 'Bristol',
    skillsRequired: ['Editorial', 'Movement', 'Stillness'],
    shootDate: '2026-07-04T10:00:00.000Z',
    shootEndDate: null,
    shootDurationHours: 8,
    paymentType: 'fixed',
    rateSetBy: 'caster',
    rateAmount: 650,
    requiresNda: false,
    exclusivity: false,
    usageRights: 'Print + web, 6 months UK',
    headcountRequired: 1,
    headcountFilled: 0,
    applicationDeadline: '2026-06-28T23:59:00.000Z',
    createdAt: '2026-05-24T09:15:00.000Z',
    imageUrl: 'https://picsum.photos/seed/editorial-fashion/1200/1500',
    caster: { id: 'c-4', companyName: 'Cooper & Stone' },
  },
  {
    id: 'shoot-005',
    casterId: 'c-5',
    title: 'Audiobook narrator — Contemporary fiction',
    description:
      'Eight-hour narration estimated across 2–3 sessions. Female-presenting voice, warm and clear delivery, age range 30–55. Remote.',
    category: 'voiceover',
    subcategory: 'Audiobook',
    visibility: 'public',
    status: 'active',
    genderRequired: 'female',
    ageMin: 30,
    ageMax: 55,
    locationCity: 'Remote',
    skillsRequired: ['Long-form narration', 'Home studio', 'Editing'],
    shootDate: '2026-07-15T00:00:00.000Z',
    shootEndDate: null,
    shootDurationHours: 12,
    paymentType: 'hourly',
    rateSetBy: 'caster',
    rateAmount: 120,
    requiresNda: false,
    exclusivity: false,
    usageRights: 'Audiobook distribution, worldwide',
    headcountRequired: 1,
    headcountFilled: 0,
    applicationDeadline: '2026-07-08T23:59:00.000Z',
    createdAt: '2026-05-26T13:00:00.000Z',
    imageUrl: 'https://picsum.photos/seed/voice-studio/1200/1500',
    caster: { id: 'c-5', companyName: 'Pavilion Brand' },
  },
  {
    id: 'shoot-006',
    casterId: 'c-6',
    title: 'Hand model — Jewellery campaign',
    description:
      'Studio shoot with three jewellery houses, brief sweeps and close-ups. Smooth hands, neutral manicure provided on set.',
    category: 'model',
    subcategory: 'Commercial',
    visibility: 'public',
    status: 'active',
    genderRequired: 'any',
    ageMin: null,
    ageMax: null,
    locationCity: 'London',
    skillsRequired: ['Hand modelling', 'Stillness'],
    shootDate: '2026-07-15T11:00:00.000Z',
    shootEndDate: null,
    shootDurationHours: 6,
    paymentType: 'fixed',
    rateSetBy: 'caster',
    rateAmount: 420,
    requiresNda: false,
    exclusivity: false,
    usageRights: 'Print + e-commerce, 12 months',
    headcountRequired: 2,
    headcountFilled: 0,
    applicationDeadline: '2026-07-08T23:59:00.000Z',
    createdAt: '2026-05-28T16:45:00.000Z',
    imageUrl: 'https://picsum.photos/seed/jewellery-hands/1200/1500',
    caster: { id: 'c-6', companyName: 'Marlowe Atelier' },
  },
  {
    id: 'shoot-007',
    casterId: 'c-7',
    title: 'Background extras — Period drama',
    description:
      'Three days of background work on a Victorian-set series. Costume + makeup provided. Looking for natural movement on set.',
    category: 'extra',
    subcategory: 'TV',
    visibility: 'public',
    status: 'active',
    genderRequired: 'any',
    ageMin: 18,
    ageMax: 70,
    locationCity: 'Edinburgh',
    skillsRequired: ['Background', 'Period work'],
    shootDate: '2026-07-22T06:00:00.000Z',
    shootEndDate: '2026-07-24T20:00:00.000Z',
    shootDurationHours: 36,
    paymentType: 'hourly',
    rateSetBy: 'caster',
    rateAmount: 22,
    requiresNda: false,
    exclusivity: false,
    usageRights: 'TV broadcast, worldwide',
    headcountRequired: 24,
    headcountFilled: 8,
    applicationDeadline: '2026-07-12T23:59:00.000Z',
    createdAt: '2026-05-29T08:30:00.000Z',
    imageUrl: 'https://picsum.photos/seed/period-drama-set/1200/1500',
    caster: { id: 'c-7', companyName: 'Foundry Productions' },
  },
  {
    id: 'shoot-008',
    casterId: 'c-8',
    title: 'Lookbook campaign — Linen brand',
    description:
      'Single-day lookbook shoot near Margate. Coastal, sun-drenched. Two models, mid-20s to early-30s, comfortable in wind + sand.',
    category: 'model',
    subcategory: 'Lookbook',
    visibility: 'public',
    status: 'active',
    genderRequired: 'any',
    ageMin: 25,
    ageMax: 32,
    locationCity: 'Margate',
    skillsRequired: ['Lookbook', 'Movement'],
    shootDate: '2026-08-03T07:30:00.000Z',
    shootEndDate: null,
    shootDurationHours: 9,
    paymentType: 'fixed',
    rateSetBy: 'open',
    rateAmount: null,
    requiresNda: false,
    exclusivity: false,
    usageRights: 'E-com + paid social, 9 months',
    headcountRequired: 2,
    headcountFilled: 0,
    applicationDeadline: '2026-07-25T23:59:00.000Z',
    createdAt: '2026-05-30T14:00:00.000Z',
    imageUrl: 'https://picsum.photos/seed/coastal-linen/1200/1500',
    caster: { id: 'c-8', companyName: 'House of Linen' },
  },
  {
    id: 'shoot-009',
    casterId: 'c-9',
    title: 'Short film lead — Coming-of-age',
    description:
      'Award-circuit short, single-camera, four-day shoot. Lead actor (any gender, age 17–22, look 18+). Speaking role, emotional arc.',
    category: 'actor',
    subcategory: 'Short film',
    visibility: 'public',
    status: 'active',
    genderRequired: 'any',
    ageMin: 18,
    ageMax: 22,
    locationCity: 'London',
    skillsRequired: ['Lead role', 'Drama', 'Improv'],
    shootDate: '2026-08-12T08:00:00.000Z',
    shootEndDate: '2026-08-15T20:00:00.000Z',
    shootDurationHours: 36,
    paymentType: 'fixed',
    rateSetBy: 'caster',
    rateAmount: 2200,
    requiresNda: false,
    exclusivity: false,
    usageRights: 'Festival + streaming, worldwide',
    headcountRequired: 1,
    headcountFilled: 0,
    applicationDeadline: '2026-07-30T23:59:00.000Z',
    createdAt: '2026-05-31T12:00:00.000Z',
    imageUrl: 'https://picsum.photos/seed/cinema-portrait/1200/1500',
    caster: { id: 'c-9', companyName: 'Linen & Light' },
  },
]
