import { BidDetailClient } from './client'

export default async function ArtistBidDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <BidDetailClient id={id} />
}
