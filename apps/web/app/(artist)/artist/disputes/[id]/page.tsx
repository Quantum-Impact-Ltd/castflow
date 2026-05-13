import { DisputeDetail } from './client'

export default async function ArtistDisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <DisputeDetail bookingId={id} />
}
