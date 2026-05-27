import { AdminDisputeDetailClient } from './admin-dispute-detail-client'

export default async function AdminDisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // The route param IS the bookingId — disputes are keyed by booking.
  const { id } = await params
  return <AdminDisputeDetailClient bookingId={id} />
}
