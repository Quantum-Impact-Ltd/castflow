'use client'

import { Briefcase, Calendar, CreditCard, MessageSquare } from 'lucide-react'
import { StatCard } from '@/components/dashboard'
import { useMyJobs } from '@/lib/hooks/use-jobs'
import { useMyBookings } from '@/lib/hooks/use-bookings'
import { useNotifications } from '@/lib/hooks/use-notifications'
import { formatCurrency } from '@/lib/utils'

export function CasterStats() {
  const jobs = useMyJobs({ limit: 200 })
  const bookings = useMyBookings({ limit: 200 })
  const unread = useNotifications({ unreadOnly: true, limit: 50 })

  const activeJobs = jobs.data?.filter((j) => j.status === 'active').length ?? 0
  const bookingsCount =
    bookings.data?.filter((b) => b.status === 'confirmed' || b.status === 'completed').length ?? 0

  // Spend this month = sum of bookings created in current calendar month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const spendMonth =
    bookings.data?.reduce((sum, b) => {
      const created = b.createdAt ? new Date(b.createdAt) : null
      if (created && created >= startOfMonth) return sum + Number(b.totalAmount ?? 0)
      return sum
    }, 0) ?? 0

  const unreadCount = unread.data?.length ?? 0

  const fmt = (v: number, pending: boolean) => (pending ? '…' : String(v))

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Active jobs"
        value={fmt(activeJobs, jobs.isPending)}
        hint="Currently live"
        icon={Briefcase}
      />
      <StatCard
        label="Bookings"
        value={fmt(bookingsCount, bookings.isPending)}
        hint="Confirmed + completed"
        icon={Calendar}
      />
      <StatCard
        label="Spend (month)"
        value={bookings.isPending ? '…' : formatCurrency(spendMonth)}
        hint="Booked this month"
        icon={CreditCard}
      />
      <StatCard
        label="Unread"
        value={fmt(unreadCount, unread.isPending)}
        hint="Notifications"
        icon={MessageSquare}
      />
    </div>
  )
}
