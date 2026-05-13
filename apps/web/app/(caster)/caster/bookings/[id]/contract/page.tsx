import { ContractClient } from '@/app/(artist)/artist/bookings/[id]/contract/client'

export default async function CasterContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ContractClient bookingId={id} signerRole="caster" />
}
