import { ReviewClient } from './review-client'

export default async function ArtistReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ReviewClient bookingId={id} />
}
