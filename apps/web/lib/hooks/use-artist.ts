'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  ArtistPersonalInfoInput,
  ModelStatsInput,
  ActorStatsInput,
  ArtistExperienceInput,
} from '@castflow/validators'
import {
  getMyProfile,
  updatePersonal,
  updateModelStats,
  updateActorStats,
  updateExperience,
  submitForReview,
} from '@/lib/api/artists'

const myProfileKey = ['artist', 'me'] as const

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong'
}

export function useMyArtistProfile() {
  return useQuery({
    queryKey: myProfileKey,
    queryFn: ({ signal }) => getMyProfile({ signal }),
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
