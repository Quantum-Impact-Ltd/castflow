import { DisputeDetail } from '@/app/(artist)/artist/disputes/[id]/client'

export default async function CasterDisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <DisputeDetail bookingId={id} />
}
