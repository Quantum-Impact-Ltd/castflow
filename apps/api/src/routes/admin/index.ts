import { Hono } from 'hono'
import { adminUserRoutes } from './users'
import { adminApplicationRoutes } from './applications'
import { adminJobRoutes } from './jobs'
import { adminBookingRoutes } from './bookings'
import { adminPaymentRoutes } from './payments'
import { adminDisputeRoutes } from './disputes'
import { adminFlaggedRoutes } from './flagged'
import { adminAnalyticsRoutes } from './analytics'
import { adminLogRoutes } from './logs'

export const adminRoutes = new Hono()

adminRoutes.route('/users', adminUserRoutes)
adminRoutes.route('/applications', adminApplicationRoutes)
adminRoutes.route('/jobs', adminJobRoutes)
adminRoutes.route('/bookings', adminBookingRoutes)
adminRoutes.route('/payments', adminPaymentRoutes)
adminRoutes.route('/disputes', adminDisputeRoutes)
adminRoutes.route('/flagged', adminFlaggedRoutes)
adminRoutes.route('/analytics', adminAnalyticsRoutes)
adminRoutes.route('/logs', adminLogRoutes)
