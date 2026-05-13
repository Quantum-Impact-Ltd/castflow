import { JobDetailClient } from './client'

export default async function ArtistJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <JobDetailClient id={id} />
}
