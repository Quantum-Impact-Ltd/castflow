import { ApplicationReviewClient } from './application-review-client'

export default async function AdminApplicationReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ApplicationReviewClient profileId={id} />
}
