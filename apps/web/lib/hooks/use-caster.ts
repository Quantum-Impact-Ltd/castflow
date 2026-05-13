'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import { getMyCaster, updateMyCaster, type UpdateCasterInput } from '@/lib/api/caster'
import { errorMessage } from './util'

export function useMyCaster() {
  return useQuery({
    queryKey: queryKeys.caster.profile(),
    queryFn: ({ signal }) => getMyCaster({ signal }),
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
