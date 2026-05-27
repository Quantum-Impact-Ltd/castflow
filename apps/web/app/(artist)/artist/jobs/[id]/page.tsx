import { ArtistJobDetailClient } from './job-detail-client'

export default async function ArtistJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ArtistJobDetailClient jobId={id} />
}
