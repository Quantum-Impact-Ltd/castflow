import { BidsListClient } from './bids-list-client'

export default async function CasterJobBidsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <BidsListClient jobId={id} />
}
