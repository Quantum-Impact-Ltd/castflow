'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  ArtistPersonalInfoInput,
  ModelStatsInput,
  ActorStatsInput,
  ArtistExperienceInput,
  UpdateArtistTypeInput,
  ReplaceSkillsInput,
  ReplaceLinksInput,
  UpdateAvailabilityInput,
} from '@castflow/validators'
import {
  getMyProfile,
  getMyIdDocumentUrl,
  updateArtistType,
  replaceSkills,
  replaceLinks,
  updatePersonal,
  updateModelStats,
  updateActorStats,
  updateExperience,
  updateAvailability,
  submitForReview,
} from '@/lib/api/artists'
import { queryKeys } from '@/lib/query-keys'

const myProfileKey = queryKeys.artist.me()

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong'
}

export function useMyArtistProfile() {
  return useQuery({
    queryKey: myProfileKey,
    queryFn: ({ signal }) => getMyProfile({ signal }),
  })
}

/**
 * Short-lived presigned read URL for the artist's own ID document. Enabled
 * only when they actually have one on file (caller passes `enabled`). The
 * URL itself expires in 10 minutes; refetched on demand.
 */
export function useMyIdDocumentUrl(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.artist.idDocumentUrl(),
    queryFn: ({ signal }) => getMyIdDocumentUrl({ signal }),
    enabled,
    // No automatic refetch — the URL is short-lived; let the user click
    // "View document" again if it expired.
    staleTime: 9 * 60 * 1000,
  })
}

export function useUpdateArtistType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateArtistTypeInput) => updateArtistType(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: myProfileKey }),
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useReplaceSkills() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ReplaceSkillsInput) => replaceSkills(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: myProfileKey }),
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useReplaceLinks() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ReplaceLinksInput) => replaceLinks(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: myProfileKey })
      toast.success('Links updated')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useUpdatePersonal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ArtistPersonalInfoInput) => updatePersonal(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: myProfileKey }),
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useUpdateModelStats() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ModelStatsInput) => updateModelStats(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: myProfileKey }),
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useUpdateActorStats() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ActorStatsInput) => updateActorStats(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: myProfileKey }),
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useUpdateExperience() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ArtistExperienceInput) => updateExperience(input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: myProfileKey }),
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useSubmitForReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => submitForReview(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: myProfileKey }),
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useUpdateAvailability() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateAvailabilityInput) => updateAvailability(input),
    onSuccess: (profile) => {
      qc.setQueryData(myProfileKey, profile)
      toast.success(
        profile.availabilityStatus === 'available'
          ? 'You’re now visible as available'
          : 'You’re now marked unavailable'
      )
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}
