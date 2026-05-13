import { ConfirmCompletionClient } from './client'

export default async function CasterBookingConfirmPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ConfirmCompletionClient bookingId={id} />
}
