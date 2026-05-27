import { AdminPaymentDetailClient } from './admin-payment-detail-client'

export default async function AdminPaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AdminPaymentDetailClient paymentId={id} />
}
