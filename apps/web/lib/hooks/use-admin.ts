'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/lib/query-keys'
import * as admin from '@/lib/api/admin'
import { errorMessage } from './util'

// ── Users ──────────────────────────────────────────────────────────────────

export function useAdminUsers(
  filters: { role?: string; status?: string; q?: string; limit?: number } = {}
) {
  return useQuery({
    queryKey: queryKeys.admin.users(filters),
    queryFn: ({ signal }) => admin.listUsers(filters, { signal }),
  })
}

export function useAdminUser(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.user(id ?? ''),
    queryFn: ({ signal }) => admin.getUser(id!, { signal }),
    enabled: Boolean(id),
  })
}

export function useSetUserStatus(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      status,
      reason,
    }: {
      status: 'active' | 'suspended' | 'banned'
      reason?: string
    }) => admin.setUserStatus(id, status, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.user(id) })
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('Status updated')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

// ── Applications ───────────────────────────────────────────────────────────

export function useApplications(filters: { status?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.admin.applications(filters),
    queryFn: ({ signal }) => admin.listApplications(filters, { signal }),
  })
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.application(id),
    queryFn: ({ signal }) => admin.getApplication(id, { signal }),
  })
}

export function useApplicationIdDocumentUrl(id: string, enabled: boolean) {
  return useQuery({
    queryKey: [...queryKeys.admin.application(id), 'id-document'] as const,
    queryFn: ({ signal }) => admin.getApplicationIdDocumentUrl(id, { signal }),
    enabled,
    staleTime: 60_000, // presigned URL is short-lived; don't refetch on every focus
  })
}

export function useApproveApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      admin.approveApplication(id, notes),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'applications'] })
      toast.success('Application approved')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useRejectApplication() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason, notes }: { id: string; reason: string; notes?: string }) =>
      admin.rejectApplication(id, reason, notes),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'applications'] })
      toast.success('Application rejected')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

// ── Jobs ───────────────────────────────────────────────────────────────────

export function useAdminJobs(filters: { status?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.admin.jobs(filters),
    queryFn: ({ signal }) => admin.listAdminJobs(filters, { signal }),
  })
}

export function useAdminJob(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.job(id ?? ''),
    queryFn: ({ signal }) => admin.getAdminJob(id!, { signal }),
    enabled: Boolean(id),
  })
}

export function useRemoveJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => admin.removeJob(id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'jobs'] })
      toast.success('Job removed')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

// ── Bookings ───────────────────────────────────────────────────────────────

export function useAdminBookings(filters: { status?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.admin.bookings(filters),
    queryFn: ({ signal }) => admin.listAdminBookings(filters, { signal }),
  })
}

export function useAdminBooking(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.booking(id ?? ''),
    queryFn: ({ signal }) => admin.getAdminBooking(id!, { signal }),
    enabled: Boolean(id),
  })
}

// ── Disputes ───────────────────────────────────────────────────────────────

export function useAdminDisputes(filters: { status?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.admin.disputes(filters),
    queryFn: ({ signal }) => admin.listAdminDisputes(filters, { signal }),
  })
}

// ── Flagged ────────────────────────────────────────────────────────────────

export function useFlaggedMessages(filters: { limit?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.admin.flaggedMessages(filters),
    queryFn: ({ signal }) => admin.listFlaggedMessages(filters, { signal }),
  })
}

export function useFlaggedReviews(filters: { limit?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.admin.flaggedReviews(filters),
    queryFn: ({ signal }) => admin.listFlaggedReviews(filters, { signal }),
  })
}

export function useFlaggedMessageContext(id: string) {
  return useQuery({
    // Keyed under ['admin','flagged',…] so clearing a flag invalidates it too.
    queryKey: ['admin', 'flagged', 'message', id, 'context'] as const,
    queryFn: ({ signal }) => admin.getFlaggedMessageContext(id, { signal }),
    enabled: Boolean(id),
  })
}

function useFlaggedModeration<T extends { id: string; notes?: string }>(
  fn: (vars: T) => Promise<unknown>,
  successMsg: string
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'flagged'] })
      toast.success(successMsg)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useClearFlaggedMessage() {
  return useFlaggedModeration<{ id: string; notes?: string }>(
    ({ id, notes }) => admin.clearFlaggedMessage(id, notes),
    'Flag cleared'
  )
}

export function useClearFlaggedReview() {
  return useFlaggedModeration<{ id: string; notes?: string }>(
    ({ id, notes }) => admin.clearFlaggedReview(id, notes),
    'Flag cleared'
  )
}

export function useRemoveFlaggedReview() {
  return useFlaggedModeration<{ id: string; notes?: string }>(
    ({ id, notes }) => admin.removeFlaggedReview(id, notes),
    'Review removed'
  )
}

// ── Reports queue ────────────────────────────────────────────────────────────

export function useReports(filters: { status?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.admin.reports(filters),
    queryFn: ({ signal }) => admin.listReports(filters, { signal }),
  })
}

function useReportAction(
  fn: (vars: { id: string; note?: string }) => Promise<unknown>,
  successMsg: string
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'reports'] })
      toast.success(successMsg)
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useResolveReport() {
  return useReportAction(({ id, note }) => admin.resolveReport(id, note), 'Report resolved')
}

export function useDismissReport() {
  return useReportAction(({ id, note }) => admin.dismissReport(id, note), 'Report dismissed')
}

// ── Analytics ──────────────────────────────────────────────────────────────

export function useAdminAnalytics() {
  return useQuery({
    queryKey: queryKeys.admin.analytics(),
    queryFn: ({ signal }) => admin.getAdminAnalytics({ signal }),
  })
}

// ── Logs ───────────────────────────────────────────────────────────────────

export function useAdminLogs(filters: { adminId?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.admin.logs(filters),
    queryFn: ({ signal }) => admin.listAdminLogs(filters, { signal }),
  })
}
