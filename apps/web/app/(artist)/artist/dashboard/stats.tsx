'use client'

import { Briefcase, Calendar, MessageSquare, PoundSterling } from 'lucide-react'
import { StatCard } from '@/components/dashboard'
import { useMyBids } from '@/lib/hooks/use-bids'
import { useMyBookings } from '@/lib/hooks/use-bookings'
import { useNotifications } from '@/lib/hooks/use-notifications'
import { formatCurrency } from '@/lib/utils'

export function ArtistStats() {
  const bids = useMyBids({ limit: 200 })
  const bookings = useMyBookings({ limit: 200 })
  const unread = useNotifications({ unreadOnly: true, limit: 50 })

  const activeBids =
    bids.data?.filter((b) => b.status === 'pending' || b.status === 'shortlisted').length ?? 0

  const confirmedBookings =
    bookings.data?.filter((b) => b.status === 'confirmed' || b.status === 'completed').length ?? 0

  const totalEarned =
    bookings.data?.reduce((sum, b) => {
      if (b.payment?.escrowStatus === 'released') {
        return sum + Number(b.payment.netArtistAmount ?? 0)
      }
      return sum
    }, 0) ?? 0

  const unreadCount = unread.data?.length ?? 0

  const fmt = (v: number) => (bids.isPending || bookings.isPending ? '…' : String(v))

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Active bids" value={fmt(activeBids)} hint="Pending review" icon={Briefcase} />
      <StatCard label="Bookings" value={fmt(confirmedBookings)} hint="Confirmed + completed" icon={Calendar} />
      <StatCard
        label="Earnings"
        value={bookings.isPending ? '…' : formatCurrency(totalEarned)}
        hint="Total paid out"
        icon={PoundSterling}
      />
      <StatCard
        label="Unread"
        value={unread.isPending ? '…' : String(unreadCount)}
        hint="Notifications"
        icon={MessageSquare}
      />
    </div>
  )
}
