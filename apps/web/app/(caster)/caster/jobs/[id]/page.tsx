import { CasterJobDetailClient } from './client'

export default async function CasterJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CasterJobDetailClient id={id} />
}
