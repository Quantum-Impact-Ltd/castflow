import type { CasterProfile } from '@castflow/types'
import { fetcher } from '@/lib/fetcher'
import type { Init } from './types'

export interface UpdateCasterInput {
  companyName?: string
  companyType?: 'brand' | 'agency' | 'production_house' | 'independent'
  contactName?: string
  phone?: string | null
  website?: string | null
}

export function getMyCaster(init?: Init) {
  return fetcher<CasterProfile>('/casters/me', init)
}

export function updateMyCaster(input: UpdateCasterInput) {
  return fetcher<CasterProfile>('/casters/me', { method: 'PATCH', body: input })
}
