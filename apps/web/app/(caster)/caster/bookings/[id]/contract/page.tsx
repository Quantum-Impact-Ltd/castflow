import { ContractClient } from './contract-client'

export default async function CasterContractPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ContractClient bookingId={id} />
}
