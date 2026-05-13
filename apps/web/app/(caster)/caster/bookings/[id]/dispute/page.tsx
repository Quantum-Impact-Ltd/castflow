import { DisputeForm } from '@/app/(artist)/artist/bookings/[id]/dispute/form'

export default async function CasterBookingDisputePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <DisputeForm bookingId={id} />
}
