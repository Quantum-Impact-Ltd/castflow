import { DisputeForm } from './form'

export default async function ArtistBookingDisputePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <DisputeForm bookingId={id} />
}
