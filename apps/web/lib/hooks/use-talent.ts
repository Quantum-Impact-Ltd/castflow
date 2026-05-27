'use client'

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import {
  getPublicArtist,
  getTalentProfile,
  searchTalent,
  type TalentFilters,
} from '@/lib/api/talent'

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

/** Public artist profile (unauthenticated) — backs the shareable /artists/:id page. */
export function usePublicArtist(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.talent.public(id ?? ''),
    queryFn: ({ signal }) => getPublicArtist(id!, { signal }),
    enabled: Boolean(id),
    retry: false,
  })
}
