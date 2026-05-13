import { ContractClient } from './client'

export default async function ArtistBookingContractPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ContractClient bookingId={id} signerRole="artist" />
}
