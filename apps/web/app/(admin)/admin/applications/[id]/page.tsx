import { ApplicationReviewClient } from './client'

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ApplicationReviewClient id={id} />
}
