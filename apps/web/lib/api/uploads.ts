import { fetcher } from '@/lib/fetcher'

export type UploadType = 'portfolio_photo' | 'portfolio_video' | 'id_document' | 'demo_reel'

export interface PresignedUploadResponse {
  uploadUrl: string
  publicUrl: string
  key: string
}

export function getPresignedUrl(input: {
  type: UploadType
  contentType: string
  size: number
  filename?: string
}) {
  return fetcher<PresignedUploadResponse>('/uploads/presigned-url', {
    method: 'POST',
    body: input,
  })
}

export function confirmUpload(input: {
  type: UploadType
  key: string
  caption?: string
  isPrimary?: boolean
}) {
  return fetcher<unknown>('/uploads/confirm', { method: 'POST', body: input })
}

export async function uploadFile(
  file: File,
  type: UploadType,
  opts: { caption?: string; isPrimary?: boolean } = {}
): Promise<{ publicUrl: string; key: string }> {
  const { uploadUrl, publicUrl, key } = await getPresignedUrl({
    type,
    contentType: file.type,
    size: file.size,
    filename: file.name,
  })

  const r2 = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })
  if (!r2.ok) throw new Error('Upload to storage failed')

  await confirmUpload({ type, key, ...opts })
  return { publicUrl, key }
}
