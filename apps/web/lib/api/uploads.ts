import { fetcher } from '@/lib/fetcher'

export type UploadType =
  | 'portfolio_photo'
  | 'portfolio_video'
  | 'id_document'
  | 'demo_reel'
  | 'caster_logo'
  | 'job_cover'

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

export interface UploadOptions {
  caption?: string
  isPrimary?: boolean
  /** 0–100. Called as bytes flow to R2 — useful for rendering a per-file
   *  progress bar. Won't be called from non-browser environments because
   *  XMLHttpRequest doesn't exist there. */
  onProgress?: (percent: number) => void
  /** Aborts the in-flight R2 PUT (does not roll back a completed upload). */
  signal?: AbortSignal
}

/**
 * Direct R2 PUT with progress events. We use XHR rather than `fetch()` here
 * because the fetch API surface doesn't expose upload-progress events —
 * `ReadableStream` request bodies would let us instrument it, but they're
 * not supported by all major browsers yet for cross-origin requests.
 * (Audit M16.)
 */
function putWithProgress(
  url: string,
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', file.type)

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100)
        resolve()
      } else {
        reject(new Error(`Upload to storage failed (HTTP ${xhr.status})`))
      }
    }
    xhr.onerror = () => reject(new Error('Upload to storage failed'))
    xhr.onabort = () => reject(new DOMException('Upload aborted', 'AbortError'))

    if (signal) {
      if (signal.aborted) {
        xhr.abort()
        return
      }
      signal.addEventListener('abort', () => xhr.abort(), { once: true })
    }

    xhr.send(file)
  })
}

export async function uploadFile(
  file: File,
  type: UploadType,
  opts: UploadOptions = {}
): Promise<{ publicUrl: string; key: string }> {
  const { uploadUrl, publicUrl, key } = await getPresignedUrl({
    type,
    contentType: file.type,
    size: file.size,
    filename: file.name,
  })

  await putWithProgress(uploadUrl, file, opts.onProgress, opts.signal)

  const { caption, isPrimary } = opts
  await confirmUpload({
    type,
    key,
    ...(caption !== undefined ? { caption } : {}),
    ...(isPrimary !== undefined ? { isPrimary } : {}),
  })
  return { publicUrl, key }
}

export function deletePortfolioItem(id: string) {
  return fetcher<{ deleted: true; id: string }>(`/uploads/portfolio/${id}`, {
    method: 'DELETE',
  })
}

export function setPrimaryPortfolioItem(id: string) {
  return fetcher<{ id: string; isPrimary: true }>(`/uploads/portfolio/${id}/primary`, {
    method: 'PATCH',
  })
}
