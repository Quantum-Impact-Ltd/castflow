import { DisputeClient } from './dispute-client'

export default async function ArtistDisputePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <DisputeClient bookingId={id} />
}
