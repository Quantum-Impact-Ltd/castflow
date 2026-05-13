import { BidForm } from './form'

export default async function ArtistJobBidPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <BidForm jobId={id} />
}
