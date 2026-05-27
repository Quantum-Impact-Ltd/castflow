import type { ArtistProfile } from '@castflow/types'
import { fetcher } from '@/lib/fetcher'
import type { Init } from './types'

export interface TalentFilters {
  q?: string
  artistType?: 'model' | 'actor'
  city?: string
  experienceLevel?: string
  minRating?: number
  cursor?: string
  limit?: number
}

export type PublicArtistProfile = Omit<
  ArtistProfile,
  'userId' | 'approvalNotes' | 'idVerified' | 'strikeCount' | 'updatedAt'
>

export function searchTalent(filters: TalentFilters = {}, init?: Init) {
  return fetcher<PublicArtistProfile[]>('/talent', { params: { ...filters }, ...init })
}

export function getTalentProfile(id: string, init?: Init) {
  return fetcher<PublicArtistProfile>(`/talent/${id}`, init)
}

/** Public (unauthenticated) artist profile for the shareable /artists/:id page. */
export function getPublicArtist(id: string, init?: Init) {
  return fetcher<PublicArtistProfile>(`/artists/${id}/public`, init)
}
