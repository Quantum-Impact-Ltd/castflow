import { UserDetailClient } from './client'

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <UserDetailClient id={id} />
}
