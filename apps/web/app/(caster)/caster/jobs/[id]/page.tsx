import { CasterJobDetailClient } from './caster-job-detail-client'

export default async function CasterJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CasterJobDetailClient jobId={id} />
}
