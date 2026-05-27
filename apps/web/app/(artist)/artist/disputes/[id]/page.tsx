import { DisputeDetailClient } from './dispute-detail-client'

export default async function ArtistDisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // The route param is the booking id — disputes are keyed by booking.
  const { id } = await params
  return <DisputeDetailClient bookingId={id} />
}
