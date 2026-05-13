'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import {
  acceptInvite,
  declineInvite,
  getInvite,
  inviteArtist,
  listMyInvites,
} from '@/lib/api/invites'
import { errorMessage } from './util'

export function useMyInvites(filters: { status?: string; cursor?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: [...queryKeys.artist.invites(), filters],
    queryFn: ({ signal }) => listMyInvites(filters, { signal }),
  })
}

export function useInvite(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.artist.invite(id ?? ''),
    queryFn: ({ signal }) => getInvite(id!, { signal }),
    enabled: Boolean(id),
  })
}

export function useInviteArtist(jobId: string) {
  return useMutation({
    mutationFn: ({ artistId, message }: { artistId: string; message?: string }) =>
      inviteArtist(jobId, artistId, message),
    onSuccess: () => toast.success('Invite sent'),
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useAcceptInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => acceptInvite(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.artist.invites() })
      toast.success('Invite accepted')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useDeclineInvite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => declineInvite(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.artist.invites() })
      toast.success('Invite declined')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}
