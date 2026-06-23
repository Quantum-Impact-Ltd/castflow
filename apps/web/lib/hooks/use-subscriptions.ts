'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import {
  getSubscriptionStatus,
  openBillingPortal,
  startCheckout,
} from '@/lib/api/subscriptions'
import { errorMessage } from './util'

export function useSubscriptionStatus() {
  return useQuery({
    queryKey: queryKeys.caster.subscription(),
    queryFn: ({ signal }) => getSubscriptionStatus({ signal }),
  })
}

export function useStartCheckout() {
  return useMutation({
    mutationFn: () => startCheckout(),
    onSuccess: (data) => {
      window.location.href = data.url
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useOpenBillingPortal() {
  return useMutation({
    mutationFn: () => openBillingPortal(),
    onSuccess: (data) => {
      window.location.href = data.url
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}
