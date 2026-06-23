import type { CasterProfile, CompanyType, JobCategory, JobPaymentType } from '@castflow/types'
import { fetcher } from '@/lib/fetcher'
import type { Init } from './types'

/** A caster's currently-open public job, as shown on their public profile. */
export interface PublicCasterJob {
  id: string
  title: string
  category: JobCategory
  locationCity: string
  shootDate: string
  paymentType: JobPaymentType
  rateAmount: number | null
  rateSetBy: 'caster' | 'open'
  coverImageUrl: string | null
  headcountRequired: number
  headcountFilled: number
}

/** A review an artist left about the caster, with the job it relates to. */
export interface PublicCasterReview {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  booking?: { job: { id: string; title: string } | null }
}

/** Sanitised public company profile (no contactName/phone/stripe/userId). */
export interface PublicCasterProfile {
  id: string
  companyName: string
  companyType: CompanyType
  logoUrl: string | null
  website: string | null
  jobsPosted: number
  ratingAvg: number | null
  ratingCount: number
  createdAt: string
  activeJobs: PublicCasterJob[]
  reviews: PublicCasterReview[]
}

export function getPublicCaster(id: string, init?: Init) {
  return fetcher<PublicCasterProfile>(`/casters/${id}/public`, init)
}

export interface UpdateCasterInput {
  companyName?: string
  companyType?: 'brand' | 'agency' | 'production_house' | 'independent'
  contactName?: string
  phone?: string | null
  website?: string | null
  /** Only `null` is accepted (to clear the logo) — setting a new logo URL
   *  happens via the upload-confirm path, server-side. */
  logoUrl?: null
}

export function getMyCaster(init?: Init) {
  return fetcher<CasterProfile>('/casters/me', init)
}

export function updateMyCaster(input: UpdateCasterInput) {
  return fetcher<CasterProfile>('/casters/me', { method: 'PATCH', body: input })
}

export function completeOnboarding() {
  return fetcher<CasterProfile>('/casters/me/complete-onboarding', { method: 'POST' })
}
