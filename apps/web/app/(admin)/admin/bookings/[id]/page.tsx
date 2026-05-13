import { AdminBookingDetailClient } from './client'

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AdminBookingDetailClient id={id} />
}
