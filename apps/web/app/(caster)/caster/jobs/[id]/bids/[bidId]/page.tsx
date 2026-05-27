import { CasterBidDetailClient } from './bid-detail-client'

export default async function CasterBidDetailPage({
  params,
}: {
  params: Promise<{ id: string; bidId: string }>
}) {
  const { id, bidId } = await params
  return <CasterBidDetailClient jobId={id} bidId={bidId} />
}
