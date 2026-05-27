import { ContractClient } from './contract-client'

export default async function ArtistContractPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ContractClient bookingId={id} />
}
