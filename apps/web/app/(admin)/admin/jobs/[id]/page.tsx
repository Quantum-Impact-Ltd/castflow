import { AdminJobDetailClient } from './admin-job-detail-client'

export default async function AdminJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AdminJobDetailClient jobId={id} />
}
