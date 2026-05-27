import type { Job } from '@castflow/types'
import type { CreateJobInput, UpdateJobInput } from '@castflow/validators'
import { fetcher } from '@/lib/fetcher'
import type { Init } from './types'

export interface JobListFilters {
  city?: string
  category?: string
  status?: string
  cursor?: string
  limit?: number
}

/** A caster's own job, carrying the bid count the API includes via `_count`. */
export interface JobWithCounts extends Job {
  _count?: { bids: number }
}

export function listPublicJobs(filters: JobListFilters = {}, init?: Init) {
  return fetcher<Job[]>('/jobs', { params: { ...filters }, ...init })
}

export function getJob(id: string, init?: Init) {
  return fetcher<Job>(`/jobs/${id}`, init)
}

export function listMyJobs(
  filters: { status?: string; cursor?: string; limit?: number } = {},
  init?: Init
) {
  return fetcher<JobWithCounts[]>('/jobs/me/list', { params: { ...filters }, ...init })
}

export function createJob(input: CreateJobInput) {
  return fetcher<Job>('/jobs', { method: 'POST', body: input })
}

export function updateJob(id: string, input: UpdateJobInput) {
  return fetcher<Job>(`/jobs/${id}`, { method: 'PATCH', body: input })
}

export function cancelJob(id: string, reason: string) {
  return fetcher<Job>(`/jobs/${id}/cancel`, { method: 'POST', body: { reason } })
}
