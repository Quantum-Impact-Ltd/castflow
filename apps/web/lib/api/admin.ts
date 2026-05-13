import type {
  ArtistProfile,
  Booking,
  Dispute,
  Job,
  Message,
  Review,
  User,
  AdminLog,
  Payment,
} from '@castflow/types'
import { fetcher } from '@/lib/fetcher'
import type { Init } from './types'

// ── Users ──────────────────────────────────────────────────────────────────

export interface AdminUserRow extends User {
  artistProfile?: { id: string; firstName: string; lastName: string } | null
  casterProfile?: { id: string; companyName: string } | null
}

export function listUsers(
  filters: { role?: string; status?: string; q?: string; cursor?: string; limit?: number } = {},
  init?: Init
) {
  return fetcher<AdminUserRow[]>('/admin/users', { params: filters, ...init })
}

export function getUser(id: string, init?: Init) {
  return fetcher<AdminUserRow>(`/admin/users/${id}`, init)
}

export function setUserStatus(
  id: string,
  status: 'active' | 'suspended' | 'banned',
  reason?: string
) {
  return fetcher<AdminUserRow>(`/admin/users/${id}/status`, {
    method: 'POST',
    body: { status, reason },
  })
}

// ── Applications ───────────────────────────────────────────────────────────

export function listApplications(
  filters: { status?: string; cursor?: string; limit?: number } = {},
  init?: Init
) {
  return fetcher<ArtistProfile[]>('/admin/applications', { params: filters, ...init })
}

export function approveApplication(id: string, notes?: string) {
  return fetcher<ArtistProfile>(`/admin/applications/${id}/approve`, {
    method: 'POST',
    body: { notes },
  })
}

export function rejectApplication(id: string, reason: string, notes?: string) {
  return fetcher<ArtistProfile>(`/admin/applications/${id}/reject`, {
    method: 'POST',
    body: { reason, notes },
  })
}

// ── Jobs ───────────────────────────────────────────────────────────────────

export function listAdminJobs(
  filters: { status?: string; cursor?: string; limit?: number } = {},
  init?: Init
) {
  return fetcher<Job[]>('/admin/jobs', { params: filters, ...init })
}

export function getAdminJob(id: string, init?: Init) {
  return fetcher<Job>(`/admin/jobs/${id}`, init)
}

export function removeJob(id: string, reason: string) {
  return fetcher<Job>(`/admin/jobs/${id}/remove`, { method: 'POST', body: { reason } })
}

// ── Bookings ───────────────────────────────────────────────────────────────

export function listAdminBookings(
  filters: { status?: string; cursor?: string; limit?: number } = {},
  init?: Init
) {
  return fetcher<Booking[]>('/admin/bookings', { params: filters, ...init })
}

export function getAdminBooking(id: string, init?: Init) {
  return fetcher<Booking>(`/admin/bookings/${id}`, init)
}

// ── Payments ───────────────────────────────────────────────────────────────

export interface AdminPaymentRow extends Payment {
  booking?: Pick<Booking, 'id' | 'jobId' | 'casterId' | 'artistId' | 'shootDate' | 'status'>
}

export function listAdminPayments(
  filters: { escrowStatus?: string; cursor?: string; limit?: number } = {},
  init?: Init
) {
  return fetcher<AdminPaymentRow[]>('/admin/payments', { params: filters, ...init })
}

export function forceReleaseEscrow(bookingId: string, notes: string) {
  return fetcher<unknown>(`/admin/payments/bookings/${bookingId}/release`, {
    method: 'POST',
    body: { notes },
  })
}

export function forceRefundEscrow(bookingId: string, notes: string) {
  return fetcher<unknown>(`/admin/payments/bookings/${bookingId}/refund`, {
    method: 'POST',
    body: { notes },
  })
}

// ── Disputes ───────────────────────────────────────────────────────────────

export function listAdminDisputes(
  filters: { status?: string; cursor?: string; limit?: number } = {},
  init?: Init
) {
  return fetcher<Dispute[]>('/admin/disputes', { params: filters, ...init })
}

// ── Flagged ────────────────────────────────────────────────────────────────

export function listFlaggedMessages(
  filters: { cursor?: string; limit?: number } = {},
  init?: Init
) {
  return fetcher<Message[]>('/admin/flagged/messages', { params: filters, ...init })
}

export function listFlaggedReviews(filters: { cursor?: string; limit?: number } = {}, init?: Init) {
  return fetcher<Review[]>('/admin/flagged/reviews', { params: filters, ...init })
}

// ── Analytics ──────────────────────────────────────────────────────────────

export interface AdminAnalyticsSummary {
  totalUsers: number
  totalArtists: number
  totalCasters: number
  pendingApplications: number
  openDisputes: number
  bookingsThisWeek: number
  revenueThisMonth: number
  newUsersWeekly: Array<{ weekStart: string; count: number }>
  jobsWeekly: Array<{ weekStart: string; count: number }>
  bookingFillRate: number
  disputeRate: number
  avgTimeToBookingHours: number | null
}

export function getAdminAnalytics(init?: Init) {
  return fetcher<AdminAnalyticsSummary>('/admin/analytics/summary', init)
}

// ── Logs ───────────────────────────────────────────────────────────────────

export function listAdminLogs(
  filters: { adminId?: string; cursor?: string; limit?: number } = {},
  init?: Init
) {
  return fetcher<AdminLog[]>('/admin/logs', { params: filters, ...init })
}
