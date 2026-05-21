'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { uploadFile, deletePortfolioItem, setPrimaryPortfolioItem, type UploadType } from '@/lib/api/uploads'
import { queryKeys } from '@/lib/query-keys'

const myProfileKey = queryKeys.artist.me()

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Upload failed'
}

interface UploadInput {
  file: File
  type: UploadType
  caption?: string
  isPrimary?: boolean
  /** Forwarded to the underlying XHR PUT so callers can render a progress
   *  bar per file in flight. (Audit M16.) */
  onProgress?: (percent: number) => void
}

export function useUploadFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, type, caption, isPrimary, onProgress }: UploadInput) =>
      uploadFile(file, type, {
        ...(caption !== undefined ? { caption } : {}),
        ...(isPrimary !== undefined ? { isPrimary } : {}),
        ...(onProgress ? { onProgress } : {}),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: myProfileKey }),
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useDeletePortfolioItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePortfolioItem(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: myProfileKey }),
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useSetPrimaryPortfolioItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => setPrimaryPortfolioItem(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: myProfileKey }),
    onError: (err) => toast.error(errorMessage(err)),
  })
}
