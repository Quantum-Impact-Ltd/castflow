import { CasterTalentProfileClient } from './talent-profile-client'

export default async function CasterTalentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CasterTalentProfileClient artistId={id} />
}
