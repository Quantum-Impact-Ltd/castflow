'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import {
  getMyCaster,
  updateMyCaster,
  completeOnboarding,
  getPublicCaster,
  type UpdateCasterInput,
} from '@/lib/api/caster'
import { errorMessage } from './util'

export function useMyCaster() {
  return useQuery({
    queryKey: queryKeys.caster.profile(),
    queryFn: ({ signal }) => getMyCaster({ signal }),
  })
}

export function usePublicCaster(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.caster.public(id ?? ''),
    queryFn: ({ signal }) => getPublicCaster(id!, { signal }),
    enabled: Boolean(id),
  })
}

export function useUpdateMyCaster() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateCasterInput) => updateMyCaster(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.caster.profile() })
      toast.success('Profile updated')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useCompleteOnboarding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => completeOnboarding(),
    // The endpoint is idempotent (it no-ops if onboardingCompletedAt is already
    // set), so retrying is safe and stops a transient blip — e.g. the API
    // restarting under `bun --watch` — from permanently trapping the caster on
    // the "Finishing setup…" screen. Mutations don't retry by default; this is
    // a deliberate per-mutation override.
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.caster.profile() }),
  })
}
