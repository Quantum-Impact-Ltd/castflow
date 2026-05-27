'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteArtistAccount, deleteCasterAccount } from '@/lib/api/account'
import { errorMessage } from './util'

export function useDeleteArtistAccount() {
  return useMutation({
    mutationFn: () => deleteArtistAccount(),
    onSuccess: () => {
      toast.success('Your account has been deleted')
      window.location.href = '/'
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useDeleteCasterAccount() {
  return useMutation({
    mutationFn: () => deleteCasterAccount(),
    onSuccess: () => {
      toast.success('Your account has been deleted')
      window.location.href = '/'
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}
