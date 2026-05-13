'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { getTalentProfile, searchTalent, type TalentFilters } from '@/lib/api/talent'

export function useTalentSearch(filters: TalentFilters = {}) {
  return useQuery({
    queryKey: queryKeys.talent.search({ ...filters }),
    queryFn: ({ signal }) => searchTalent(filters, { signal }),
  })
}

export function useTalentProfile(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.talent.detail(id ?? ''),
    queryFn: ({ signal }) => getTalentProfile(id!, { signal }),
    enabled: Boolean(id),
  })
}
