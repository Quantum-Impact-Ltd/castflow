import type {
  ArtistPersonalInfoInput,
  ModelStatsInput,
  ActorStatsInput,
  ArtistExperienceInput,
} from '@castflow/validators'
import { fetcher } from '@/lib/fetcher'

export interface MyArtistProfile {
  id: string
  userId: string
  artistType: 'model' | 'actor'
  firstName: string
  lastName: string
  dob: string | null
  gender: string | null
  pronouns: string | null
  city: string | null
  bio: string | null
  experienceLevel: 'new_face' | 'semi_pro' | 'professional' | null
  instagramHandle: string | null
  approvalStatus: 'pending' | 'approved' | 'rejected'
  approvalNotes: string | null
  submittedAt: string | null
  idDocumentUrl: string | null
  idVerified: boolean
  modelStats: Record<string, unknown> | null
  actorStats: Record<string, unknown> | null
  portfolioItems: Array<Record<string, unknown>>
  skills: Array<Record<string, unknown>>
}

interface Init {
  signal?: AbortSignal
}

export function getMyProfile(init?: Init): Promise<MyArtistProfile> {
  return fetcher<MyArtistProfile>('/artists/me', { method: 'GET', ...init })
}

export function updatePersonal(input: ArtistPersonalInfoInput, init?: Init) {
  return fetcher<MyArtistProfile>('/artists/me/personal', {
    method: 'PATCH',
    body: input,
    ...init,
  })
}

export function updateModelStats(input: ModelStatsInput, init?: Init) {
  return fetcher<Record<string, unknown>>('/artists/me/model-stats', {
    method: 'PATCH',
    body: input,
    ...init,
  })
}

export function updateActorStats(input: ActorStatsInput, init?: Init) {
  return fetcher<Record<string, unknown>>('/artists/me/actor-stats', {
    method: 'PATCH',
    body: input,
    ...init,
  })
}

export function updateExperience(input: ArtistExperienceInput, init?: Init) {
  return fetcher<MyArtistProfile>('/artists/me/experience', {
    method: 'PATCH',
    body: input,
    ...init,
  })
}

export function submitForReview(init?: Init) {
  return fetcher<MyArtistProfile>('/artists/me/submit', { method: 'POST', ...init })
}
