import { PageHeader } from '@/components/dashboard'
import { CasterBookingsList } from './list'

export default function CasterBookingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" description="Confirmed shoots, contracts, and payments." />
      <CasterBookingsList />
    </div>
  )
}
