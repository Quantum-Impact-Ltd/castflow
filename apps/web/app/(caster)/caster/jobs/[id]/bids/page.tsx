import { CasterBidsClient } from './client'

export default async function CasterJobBidsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CasterBidsClient jobId={id} />
}
