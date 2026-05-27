import type {
  ArtistPersonalInfoInput,
  ModelStatsInput,
  ActorStatsInput,
  ArtistExperienceInput,
  UpdateArtistTypeInput,
  ReplaceSkillsInput,
  UpdateAvailabilityInput,
} from '@castflow/validators'
import type { ModelStats, ActorStats, PortfolioItem, ArtistSkill } from '@castflow/types'
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
  availabilityStatus: 'available' | 'unavailable'
  approvalStatus: 'pending' | 'approved' | 'rejected'
  approvalNotes: string | null
  submittedAt: string | null
  idDocumentUrl: string | null
  idVerified: boolean
  ratingAvg: number | null
  ratingCount: number
  jobsCompleted: number
  responseRate: number | null
  strikeCount: number
  modelStats: ModelStats | null
  actorStats: ActorStats | null
  portfolioItems: PortfolioItem[]
  skills: ArtistSkill[]
}

interface Init {
  signal?: AbortSignal
}

export function getMyProfile(init?: Init): Promise<MyArtistProfile> {
  return fetcher<MyArtistProfile>('/artists/me', { method: 'GET', ...init })
}

export interface IdDocumentUrlResponse {
  url: string
  expiresIn: number
  contentTypeHint: 'image' | 'pdf' | 'unknown'
}

export function getMyIdDocumentUrl(init?: Init): Promise<IdDocumentUrlResponse> {
  return fetcher<IdDocumentUrlResponse>('/artists/me/id-document/url', {
    method: 'GET',
    ...init,
  })
}

export function updateArtistType(input: UpdateArtistTypeInput, init?: Init) {
  return fetcher<MyArtistProfile>('/artists/me/type', {
    method: 'PATCH',
    body: input,
    ...init,
  })
}

export function replaceSkills(input: ReplaceSkillsInput, init?: Init) {
  return fetcher<Array<Record<string, unknown>>>('/artists/me/skills', {
    method: 'PUT',
    body: input,
    ...init,
  })
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

export function updateAvailability(input: UpdateAvailabilityInput, init?: Init) {
  return fetcher<MyArtistProfile>('/artists/me/availability', {
    method: 'PATCH',
    body: input,
    ...init,
  })
}
