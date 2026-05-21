import type { CasterProfile } from '@castflow/types'
import { fetcher } from '@/lib/fetcher'
import type { Init } from './types'

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
