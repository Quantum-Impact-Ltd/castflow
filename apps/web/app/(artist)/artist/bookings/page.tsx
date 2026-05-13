import { PageHeader } from '@/components/dashboard'
import { ArtistBookingsList } from './list'

export default function ArtistBookingsPage() {
  return (
    <div>
      <PageHeader title="Bookings" description="Confirmed shoots and their status." />
      <ArtistBookingsList />
    </div>
  )
}
