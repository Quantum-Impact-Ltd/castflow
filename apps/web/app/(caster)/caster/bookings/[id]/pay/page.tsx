import { CasterPayClient } from './client'

export default async function CasterBookingPayPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CasterPayClient bookingId={id} />
}
