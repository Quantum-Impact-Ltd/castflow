import type {
  ArtistProfile,
  Booking,
  Contract,
  Dispute,
  Job,
  Message,
  Review,
  User,
  AdminLog,
} from '@castflow/types'
import { fetcher } from '@/lib/fetcher'
import type { Init } from './types'
import type { IdDocumentUrlResponse } from './artists'

// ── Users ──────────────────────────────────────────────────────────────────

export interface AdminUserRow extends User {
  artistProfile?: { id: string; firstName: string; lastName: string } | null
  casterProfile?: { id: string; companyName: string } | null
}

export interface AdminUserActivity {
  role: 'artist' | 'caster'
  bids?: number
  jobsPosted?: number
  bookings: number
  completedBookings: number
  reviewsReceived: number
  strikeCount?: number
}

export interface AdminUserDetail extends AdminUserRow {
  activity?: AdminUserActivity | null
}

export function listUsers(
  filters: { role?: string; status?: string; q?: string; cursor?: string; limit?: number } = {},
  init?: Init
) {
  return fetcher<AdminUserRow[]>('/admin/users', { params: filters, ...init })
}

export function getUser(id: string, init?: Init) {
  return fetcher<AdminUserDetail>(`/admin/users/${id}`, init)
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

export function getApplication(id: string, init?: Init) {
  return fetcher<ArtistProfile>(`/admin/applications/${id}`, init)
}

export function getApplicationIdDocumentUrl(id: string, init?: Init) {
  return fetcher<IdDocumentUrlResponse>(`/admin/applications/${id}/id-document/url`, {
    method: 'GET',
    ...init,
  })
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

export interface AdminBookingListRow extends Booking {
  job?: { title: string } | null
  artist?: { firstName: string; lastName: string } | null
  caster?: { companyName: string } | null
}

export function listAdminBookings(
  filters: { status?: string; cursor?: string; limit?: number } = {},
  init?: Init
) {
  return fetcher<AdminBookingListRow[]>('/admin/bookings', { params: filters, ...init })
}

/** Booking detail carries the related job/artist/caster the API includes, so
 *  the UI can show names (and resolve dispute parties by userId) without raw ids. */
export interface AdminBookingDetail extends Booking {
  job?: Pick<Job, 'id' | 'title'> | null
  artist?: { id: string; userId: string; firstName: string; lastName: string } | null
  caster?: { id: string; userId: string; companyName: string; contactName: string } | null
  contract?: Contract | null
  dispute?: Dispute | null
}

export function getAdminBooking(id: string, init?: Init) {
  return fetcher<AdminBookingDetail>(`/admin/bookings/${id}`, init)
}

// ── Disputes ───────────────────────────────────────────────────────────────

export function listAdminDisputes(
  filters: { status?: string; cursor?: string; limit?: number } = {},
  init?: Init
) {
  return fetcher<Dispute[]>('/admin/disputes', { params: filters, ...init })
}

// ── Flagged ────────────────────────────────────────────────────────────────

export interface FlaggedMessageRow extends Message {
  senderName: string | null
  thread?: { jobId: string; casterId: string; artistId: string } | null
}

export interface FlaggedReviewRow extends Review {
  reviewerName: string | null
  revieweeName: string | null
  flagReason?: string | null
}

export interface FlaggedParticipant {
  profileId: string
  userId: string
  name: string
}

export interface FlaggedConversationMessage {
  id: string
  content: string
  isFlagged: boolean
  flagReason: string | null
  createdAt: string
  readAt: string | null
  senderUserId: string
  senderName: string
  senderRole: 'caster' | 'artist' | 'unknown'
  isSubject: boolean
}

export interface FlaggedReport {
  id: string
  reason: string
  detail: string | null
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed'
  createdAt: string
  reporterUserId: string
  reporterName: string
  reporterRole: 'caster' | 'artist' | 'unknown'
}

export interface FlaggedMessageContext {
  message: FlaggedMessageRow
  job: { id: string; title: string } | null
  participants: {
    caster: FlaggedParticipant | null
    artist: FlaggedParticipant | null
  }
  conversation: FlaggedConversationMessage[]
  reports: FlaggedReport[]
  flaggedCount: number
  reportedParty: 'caster' | 'artist' | null
}

export function listFlaggedMessages(
  filters: { cursor?: string; limit?: number } = {},
  init?: Init
) {
  return fetcher<FlaggedMessageRow[]>('/admin/flagged/messages', { params: filters, ...init })
}

export function getFlaggedMessageContext(id: string, init?: Init) {
  return fetcher<FlaggedMessageContext>(`/admin/flagged/messages/${id}/context`, init)
}

export function listFlaggedReviews(filters: { cursor?: string; limit?: number } = {}, init?: Init) {
  return fetcher<FlaggedReviewRow[]>('/admin/flagged/reviews', { params: filters, ...init })
}

export function clearFlaggedMessage(id: string, notes?: string) {
  return fetcher<Message>(`/admin/flagged/messages/${id}/clear`, {
    method: 'POST',
    body: { notes },
  })
}

export function clearFlaggedReview(id: string, notes?: string) {
  return fetcher<Review>(`/admin/flagged/reviews/${id}/clear`, { method: 'POST', body: { notes } })
}

export function removeFlaggedReview(id: string, notes?: string) {
  return fetcher<Review>(`/admin/flagged/reviews/${id}/remove`, { method: 'POST', body: { notes } })
}

// ── Reports queue ────────────────────────────────────────────────────────────

export interface AdminReportRow {
  id: string
  reporterId: string
  reporterName: string | null
  targetType: 'message_thread' | 'review'
  targetId: string
  targetLabel: string
  reason: string
  detail: string | null
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed'
  reviewedById: string | null
  reviewedAt: string | null
  resolutionNote: string | null
  createdAt: string
}

export function listReports(
  filters: { status?: string; cursor?: string; limit?: number } = {},
  init?: Init
) {
  return fetcher<AdminReportRow[]>('/admin/reports', { params: filters, ...init })
}

export function resolveReport(id: string, note?: string) {
  return fetcher<AdminReportRow>(`/admin/reports/${id}/resolve`, { method: 'POST', body: { note } })
}

export function dismissReport(id: string, note?: string) {
  return fetcher<AdminReportRow>(`/admin/reports/${id}/dismiss`, { method: 'POST', body: { note } })
}

// ── Analytics ──────────────────────────────────────────────────────────────

export interface AdminAnalyticsSummary {
  totalUsers: number
  totalArtists: number
  totalCasters: number
  pendingApplications: number
  openDisputes: number
  bookingsThisWeek: number
  activeSubscriptions: number
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

export interface AdminLogRow extends AdminLog {
  adminName: string | null
  entityLabel: string | null
}

export function listAdminLogs(
  filters: { adminId?: string; cursor?: string; limit?: number } = {},
  init?: Init
) {
  return fetcher<AdminLogRow[]>('/admin/logs', { params: filters, ...init })
}
