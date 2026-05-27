import { BookingDetailClient } from './booking-detail-client'

export default async function ArtistBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <BookingDetailClient bookingId={id} />
}
