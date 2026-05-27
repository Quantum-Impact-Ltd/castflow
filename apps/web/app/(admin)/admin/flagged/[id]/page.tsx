import { FlaggedDetailClient } from './flagged-detail-client'

// Next 16: params and searchParams are both Promises — await both.
export default async function AdminFlaggedDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ type?: string }>
}) {
  const [{ id }, { type }] = await Promise.all([params, searchParams])
  const normalised = type === 'review' ? 'review' : 'message'

  return <FlaggedDetailClient id={id} type={normalised} />
}
