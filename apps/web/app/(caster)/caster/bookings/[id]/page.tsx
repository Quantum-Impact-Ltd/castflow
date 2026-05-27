import { CasterBookingDetailClient } from './caster-booking-detail-client'

export default async function CasterBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CasterBookingDetailClient bookingId={id} />
}
