'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import { getCalendarFeedUrl, regenerateCalendarFeed } from '@/lib/api/calendar'
import { errorMessage } from './util'

export function useCalendarFeed() {
  return useQuery({
    queryKey: queryKeys.calendar.feed(),
    queryFn: ({ signal }) => getCalendarFeedUrl({ signal }),
  })
}

export function useRegenerateCalendarFeed() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => regenerateCalendarFeed(),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.calendar.feed(), data)
      toast.success('Calendar link regenerated — the old link no longer works')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}
