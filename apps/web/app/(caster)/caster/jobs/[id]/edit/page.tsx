import { CasterJobEditClient } from './client'

export default async function CasterJobEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CasterJobEditClient id={id} />
}
