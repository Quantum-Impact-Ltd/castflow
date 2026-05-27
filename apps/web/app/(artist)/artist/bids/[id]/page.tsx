import { ArtistBidDetailClient } from './bid-detail-client'

export default async function ArtistBidDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ArtistBidDetailClient bidId={id} />
}
