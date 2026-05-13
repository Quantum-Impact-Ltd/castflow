'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import { generateContract, getContract, signContract } from '@/lib/api/contracts'
import { errorMessage } from './util'

export function useContract(bookingId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.contract.forBooking(bookingId ?? ''),
    queryFn: ({ signal }) => getContract(bookingId!, { signal }),
    enabled: Boolean(bookingId),
    retry: false,
  })
}

export function useGenerateContract(bookingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => generateContract(bookingId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.contract.forBooking(bookingId) })
      toast.success('Contract generated')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useSignContract(bookingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (signatureName: string) => signContract(bookingId, signatureName),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.contract.forBooking(bookingId) })
      void qc.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) })
      toast.success('Contract signed')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}
