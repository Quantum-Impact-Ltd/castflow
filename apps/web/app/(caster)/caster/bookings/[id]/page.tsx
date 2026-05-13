import { CasterBookingDetailClient } from './client'

export default async function CasterBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CasterBookingDetailClient id={id} />
}
