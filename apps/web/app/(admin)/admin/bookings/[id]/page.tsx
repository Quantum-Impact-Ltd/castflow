import { AdminBookingDetailClient } from './admin-booking-detail-client'

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AdminBookingDetailClient bookingId={id} />
}
