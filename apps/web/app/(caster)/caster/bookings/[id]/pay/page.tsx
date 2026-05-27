import { PayClient } from './pay-client'

export default async function CasterPayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PayClient bookingId={id} />
}
