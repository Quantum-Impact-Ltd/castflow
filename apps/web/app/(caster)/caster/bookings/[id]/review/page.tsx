import { ReviewForm } from '@/app/(artist)/artist/bookings/[id]/review/form'

export default async function CasterBookingReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ReviewForm bookingId={id} />
}
