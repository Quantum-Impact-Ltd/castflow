import { ReviewForm } from './form'

export default async function ArtistBookingReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ReviewForm bookingId={id} />
}
