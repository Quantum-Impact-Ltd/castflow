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

// ── Payments ───────────────────────────────────────────────────────────────

export function useAdminPayments(filters: { escrowStatus?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.admin.payments(filters),
    queryFn: ({ signal }) => admin.listAdminPayments(filters, { signal }),
  })
}

export function useForceRelease() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, notes }: { bookingId: string; notes: string }) =>
      admin.forceReleaseEscrow(bookingId, notes),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'payments'] })
      toast.success('Escrow released')
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useForceRefund() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, notes }: { bookingId: string; notes: string }) =>
      admin.forceRefundEscrow(bookingId, notes),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'payments'] })
      toast.success('Escrow refunded')
    },
    onError: (err) => toast.error(errorMessage(err)),
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
