'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { CreateJobInput, UpdateJobInput } from '@castflow/validators'
import { queryKeys } from '@/lib/query-keys'
import {
  cancelJob,
  createJob,
  getJob,
  listMyJobs,
  listPublicJobs,
  updateJob,
  type JobListFilters,
} from '@/lib/api/jobs'
import { errorMessage } from './util'

export function usePublicJobs(filters: JobListFilters = {}) {
  return useQuery({
    queryKey: queryKeys.jobs.list({ ...filters }),
    queryFn: ({ signal }) => listPublicJobs(filters, { signal }),
  })
}

export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.jobs.detail(id ?? ''),
    queryFn: ({ signal }) => getJob(id!, { signal }),
    enabled: Boolean(id),
  })
}

export function useMyJobs(filters: { cursor?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: [...queryKeys.caster.jobs(), filters],
    queryFn: ({ signal }) => listMyJobs(filters, { signal }),
  })
}

export function useCreateJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateJobInput) => createJob(input),
    onSuccess: (job) => {
      void qc.invalidateQueries({ queryKey: queryKeys.caster.jobs() })
      qc.setQueryData(queryKeys.jobs.detail(job.id), job)
      toast.success('Job posted')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useUpdateJob(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateJobInput) => updateJob(id, input),
    onSuccess: (job) => {
      void qc.invalidateQueries({ queryKey: queryKeys.caster.jobs() })
      qc.setQueryData(queryKeys.jobs.detail(job.id), job)
      toast.success('Job updated')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useCancelJob(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reason: string) => cancelJob(id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.caster.jobs() })
      void qc.invalidateQueries({ queryKey: queryKeys.jobs.detail(id) })
      toast.success('Job cancelled')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}
