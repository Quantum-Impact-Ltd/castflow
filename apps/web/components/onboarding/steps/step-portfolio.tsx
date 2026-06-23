'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'
import { Star, Trash2, UploadCloud, ImageIcon, AlertCircle, RotateCcw, X } from 'lucide-react'
import { toast } from 'sonner'
import { UPLOAD_LIMITS } from '@castflow/validators'
import type { PortfolioEntryType, PortfolioItem } from '@castflow/types'
import {
  useUploadFile,
  useDeletePortfolioItem,
  useSetPrimaryPortfolioItem,
} from '@/lib/hooks/use-uploads'
import { ENTRY_TYPES, ENTRY_TYPE_LABEL } from '@/lib/portfolio-meta'
import { PortfolioEntryEditDialog } from '@/components/portfolio/portfolio-entry-edit-dialog'
import { cn } from '@/lib/utils'
import { StepNav } from '../step-nav'
import type { MyArtistProfile } from '@/lib/api/artists'

interface StepPortfolioProps {
  profile: MyArtistProfile
  onBack: () => void
  onNext: () => void
}

const MIN_PHOTOS = 3
const ALLOWED_PHOTO_TYPES = UPLOAD_LIMITS.portfolio_photo.types
const MAX_PHOTO_MB = UPLOAD_LIMITS.portfolio_photo.maxSizeMb

export function StepPortfolio({ profile, onBack, onNext }: StepPortfolioProps) {
  const items = profile.portfolioItems ?? []
  const photoCount = items.filter((i) => i.type === 'photo').length

  const upload = useUploadFile()
  const del = useDeletePortfolioItem()
  const setPrimary = useSetPrimaryPortfolioItem()

  // Entry metadata applied to the next upload batch — brings onboarding to
  // parity with the profile editor's typed-entry model. Description + links are
  // added per entry afterwards via the shared "Edit details" dialog.
  const [entryType, setEntryType] = useState<PortfolioEntryType>('shoot')
  const [entryTitle, setEntryTitle] = useState('')

  // Track which item IDs are currently being deleted so each card shows its own spinner
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  // Per-file upload progress + failure state for placeholder cards (Audit
  // M16/M17). We hang onto the original File handle so a failed entry can be
  // retried in place — losing the file on error and forcing the user to
  // find it again on disk was a known UX gap.
  const [pendingUploads, setPendingUploads] = useState<
    Array<{
      id: string
      name: string
      file: File
      progress: number
      status: 'uploading' | 'failed'
      error?: string
      entryType: PortfolioEntryType
      title?: string
    }>
  >([])

  const updateProgress = (id: string, progress: number) => {
    setPendingUploads((prev) => prev.map((p) => (p.id === id ? { ...p, progress } : p)))
  }

  const markFailed = (id: string, error: string) => {
    setPendingUploads((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'failed' as const, error, progress: 0 } : p))
    )
  }

  const removePending = (id: string) => {
    setPendingUploads((prev) => prev.filter((p) => p.id !== id))
  }

  const startUpload = (
    uploadId: string,
    file: File,
    meta: { entryType: PortfolioEntryType; title?: string }
  ) => {
    setPendingUploads((prev) =>
      prev.map((p) =>
        p.id === uploadId
          ? { ...p, status: 'uploading' as const, progress: 0, error: undefined }
          : p
      )
    )
    upload.mutate(
      {
        file,
        type: 'portfolio_photo',
        entryType: meta.entryType,
        ...(meta.title ? { title: meta.title } : {}),
        onProgress: (pct) => updateProgress(uploadId, pct),
      },
      {
        onSuccess: () => {
          toast.success(`${file.name} uploaded`)
          removePending(uploadId)
        },
        onError: (err) => {
          markFailed(uploadId, err instanceof Error ? err.message : 'Upload failed')
        },
      }
    )
  }

  const retryUpload = (id: string) => {
    const entry = pendingUploads.find((p) => p.id === id)
    if (!entry) return
    startUpload(entry.id, entry.file, {
      entryType: entry.entryType,
      ...(entry.title ? { title: entry.title } : {}),
    })
  }

  const onDrop = (files: File[]) => {
    // Capture the entry metadata at drop time so it sticks with this batch even
    // if the artist changes the selector before the upload finishes.
    const meta = { entryType, ...(entryTitle.trim() ? { title: entryTitle.trim() } : {}) }
    for (const file of files) {
      if (!ALLOWED_PHOTO_TYPES.includes(file.type as (typeof ALLOWED_PHOTO_TYPES)[number])) {
        toast.error(`${file.name} — unsupported file type`)
        continue
      }
      if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
        toast.error(`${file.name} — too large (max ${MAX_PHOTO_MB} MB)`)
        continue
      }
      const uploadId = `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      setPendingUploads((prev) => [
        ...prev,
        {
          id: uploadId,
          name: file.name,
          file,
          progress: 0,
          status: 'uploading',
          ...meta,
        },
      ])
      startUpload(uploadId, file, meta)
    }
    setEntryTitle('')
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: MAX_PHOTO_MB * 1024 * 1024,
    disabled: upload.isPending,
  })

  const handleDelete = (id: string) => {
    setDeletingIds((prev) => new Set(prev).add(id))
    del.mutate(id, {
      onSettled: () =>
        setDeletingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        }),
    })
  }

  const handleSetPrimary = (id: string) => {
    setPrimary.mutate(id)
  }

  const canContinue = photoCount >= MIN_PHOTOS

  return (
    <div className="space-y-6">
      {/* Entry metadata for the next upload — parity with the profile editor. */}
      <div className="grid gap-3 rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span className="text-white/70">Entry type</span>
          <select
            value={entryType}
            onChange={(e) => setEntryType(e.target.value as PortfolioEntryType)}
            className="w-full rounded-lg border border-white/15 bg-[var(--ink-900)] px-3 py-2 text-sm text-white focus:border-[var(--cta-400)]/60 focus:outline-none"
          >
            {ENTRY_TYPES.map((t) => (
              <option key={t} value={t} className="bg-[var(--ink-900)]">
                {ENTRY_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="text-white/70">Title (optional)</span>
          <input
            value={entryTitle}
            onChange={(e) => setEntryTitle(e.target.value)}
            maxLength={120}
            placeholder="e.g. Vogue Italia — AW26"
            className="w-full rounded-lg border border-white/15 bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[var(--cta-400)]/60 focus:outline-none"
          />
        </label>
        <p className="text-xs text-white/70 sm:col-span-2">
          Type + title apply to the next photo(s) you upload. Add a description and links per entry
          with “Edit details” below.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          'cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition',
          isDragActive
            ? 'border-[var(--cta-400)]/70 bg-[var(--cta-400)]/[0.04]'
            : 'border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]',
          upload.isPending && 'cursor-wait opacity-60'
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto mb-3 h-8 w-8 text-white/55" />
        <p className="text-sm font-medium text-white">
          {isDragActive ? 'Drop to upload' : 'Drag photos here, or click to browse'}
        </p>
        <p className="mt-1 text-xs text-white/50">
          JPG, PNG or WebP · up to {MAX_PHOTO_MB} MB · multiple at once
        </p>
        {(() => {
          const activeCount = pendingUploads.filter((p) => p.status === 'uploading').length
          const failedCount = pendingUploads.filter((p) => p.status === 'failed').length
          if (activeCount === 0 && failedCount === 0) return null
          return (
            <p className="mt-2 text-xs">
              {activeCount > 0 && (
                <span className="text-[var(--cta-400)]">
                  Uploading {activeCount} file{activeCount === 1 ? '' : 's'}…
                </span>
              )}
              {activeCount > 0 && failedCount > 0 && <span className="text-white/70"> · </span>}
              {failedCount > 0 && <span className="text-rose-300">{failedCount} failed</span>}
            </p>
          )
        })()}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-white/55">
          <strong className={cn(canContinue ? 'text-[var(--cta-400)]' : 'text-rose-300')}>
            {photoCount}
          </strong>{' '}
          of {MIN_PHOTOS} minimum photos uploaded
        </span>
        <span className="text-white/70">Tip: include a headshot, a full-body, and one other</span>
      </div>

      {items.length === 0 && pendingUploads.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-10 text-center">
          <ImageIcon className="h-6 w-6 text-white/70" />
          <p className="text-sm text-white/55">No photos yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {pendingUploads.map((p) => (
            <UploadProgressCard
              key={p.id}
              name={p.name}
              progress={p.progress}
              status={p.status}
              {...(p.error !== undefined ? { error: p.error } : {})}
              onRetry={() => retryUpload(p.id)}
              onDismiss={() => removePending(p.id)}
            />
          ))}
          {items.map((item) => (
            <PortfolioCard
              key={item.id}
              item={item}
              onDelete={() => handleDelete(item.id)}
              onSetPrimary={() => handleSetPrimary(item.id)}
              isDeleting={deletingIds.has(item.id)}
              isSettingPrimary={setPrimary.isPending}
            />
          ))}
        </div>
      )}

      {!canContinue && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-400/20 bg-rose-400/[0.06] p-3 text-xs text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Upload at least {MIN_PHOTOS} photos before continuing. This is enforced when you submit
            for review.
          </span>
        </div>
      )}

      <StepNav onBack={onBack} onNext={onNext} nextType="button" nextDisabled={!canContinue} />
    </div>
  )
}

function PortfolioCard({
  item,
  onDelete,
  onSetPrimary,
  isDeleting,
  isSettingPrimary,
}: {
  item: PortfolioItem
  onDelete: () => void
  onSetPrimary: () => void
  isDeleting: boolean
  isSettingPrimary: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="group relative aspect-square overflow-hidden rounded-xl border border-white/12 bg-white/[0.04]">
        <Image
          src={item.url}
          alt={item.title ?? item.caption ?? 'Portfolio item'}
          fill
          sizes="(min-width: 768px) 25vw, 50vw"
          className="object-cover"
        />
        {item.isPrimary ? (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-[var(--cta-400)] px-2 py-0.5 text-[10px] font-medium text-[var(--ink-900)]">
            <Star className="h-3 w-3 fill-current" />
            Primary
          </span>
        ) : (
          <button
            type="button"
            onClick={onSetPrimary}
            disabled={isSettingPrimary}
            className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 backdrop-blur transition hover:bg-black/70 group-hover:opacity-100 disabled:opacity-30"
            aria-label="Set as primary photo"
          >
            <Star className="h-3 w-3" />
            Set primary
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="absolute right-2 bottom-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/90 text-white opacity-0 transition hover:bg-rose-500 group-hover:opacity-100 disabled:opacity-30"
          aria-label="Delete photo"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        {isDeleting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="text-xs text-white">Deleting…</span>
          </div>
        )}
      </div>
      <div className="px-0.5">
        <p className="truncate text-[11px] font-medium text-white">
          {item.title || ENTRY_TYPE_LABEL[item.entryType]}
        </p>
        <p className="text-[10px] uppercase tracking-wide text-white/70">
          {ENTRY_TYPE_LABEL[item.entryType]}
          {item.links.length > 0
            ? ` · ${item.links.length} link${item.links.length === 1 ? '' : 's'}`
            : ''}
        </p>
      </div>
      <PortfolioEntryEditDialog
        item={item}
        trigger={
          <button
            type="button"
            className="w-full rounded-lg border border-white/15 bg-white/[0.04] px-2 py-1 text-[11px] font-medium text-white/80 transition hover:bg-white/[0.1]"
          >
            Edit details
          </button>
        }
      />
    </div>
  )
}

function UploadProgressCard({
  name,
  progress,
  status,
  error,
  onRetry,
  onDismiss,
}: {
  name: string
  progress: number
  status: 'uploading' | 'failed'
  error?: string
  onRetry: () => void
  onDismiss: () => void
}) {
  if (status === 'failed') {
    return (
      <div
        className="group relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-rose-400/30 bg-rose-400/[0.06] p-4 text-center"
        role="status"
        aria-label={`Upload failed for ${name}${error ? `: ${error}` : ''}`}
      >
        <AlertCircle className="h-6 w-6 text-rose-300" aria-hidden />
        <p className="line-clamp-2 text-[11px] font-medium text-rose-100">{name}</p>
        {error ? <p className="line-clamp-2 text-[10px] text-rose-200/80">{error}</p> : null}
        <div className="mt-1 flex items-center gap-1.5">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/[0.06] px-2 py-1 text-[11px] font-medium text-white transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta-400)]/40"
          >
            <RotateCcw className="h-3 w-3" aria-hidden />
            Retry
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cta-400)]/40"
            aria-label={`Dismiss ${name}`}
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="group relative flex aspect-square flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-4"
      role="status"
      aria-label={`Uploading ${name}: ${progress}%`}
    >
      <UploadCloud className="h-6 w-6 text-white/55" aria-hidden />
      <p className="line-clamp-2 text-center text-[11px] text-white/65">{name}</p>
      <div className="w-full">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[var(--cta-400)] transition-[width] duration-200"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
        <p className="mt-1.5 text-center font-mono text-[10px] font-semibold tracking-wider text-white/75">
          {progress}%
        </p>
      </div>
    </div>
  )
}
