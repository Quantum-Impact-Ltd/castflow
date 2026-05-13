'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import {
  createEscrowIntent,
  getConnectStatus,
  releaseEscrow,
  startConnectOnboarding,
} from '@/lib/api/payments'
import { errorMessage } from './util'

export function useConnectStatus() {
  return useQuery({
    queryKey: queryKeys.artist.payouts(),
    queryFn: ({ signal }) => getConnectStatus({ signal }),
  })
}

export function useStartConnectOnboarding() {
  return useMutation({
    mutationFn: () => startConnectOnboarding(),
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useCreateEscrowIntent() {
  return useMutation({
    mutationFn: (bookingId: string) => createEscrowIntent(bookingId),
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useReleaseEscrow(bookingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => releaseEscrow(bookingId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) })
      toast.success('Funds released to artist')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}
