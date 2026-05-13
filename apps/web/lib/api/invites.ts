import type { Job, JobInvite } from '@castflow/types'
import { fetcher } from '@/lib/fetcher'
import type { Init } from './types'

export interface InviteWithJob extends JobInvite {
  job?: Job
}

export function inviteArtist(jobId: string, artistId: string, message?: string) {
  return fetcher<JobInvite>(`/invites/jobs/${jobId}`, {
    method: 'POST',
    body: { artistId, message },
  })
}

export function listMyInvites(
  filters: { status?: string; cursor?: string; limit?: number } = {},
  init?: Init
) {
  return fetcher<InviteWithJob[]>('/invites/me/list', { params: filters, ...init })
}

export function getInvite(id: string, init?: Init) {
  return fetcher<InviteWithJob>(`/invites/${id}`, init)
}

export function acceptInvite(id: string) {
  return fetcher<JobInvite>(`/invites/${id}/accept`, { method: 'POST' })
}

export function declineInvite(id: string) {
  return fetcher<JobInvite>(`/invites/${id}/decline`, { method: 'POST' })
}
