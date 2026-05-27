import { EditJobClient } from './edit-job-client'

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <EditJobClient jobId={id} />
}
