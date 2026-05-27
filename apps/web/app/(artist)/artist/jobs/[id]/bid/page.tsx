import { BidFormClient } from './bid-form-client'

export default async function SubmitBidPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BidFormClient jobId={id} />
}
