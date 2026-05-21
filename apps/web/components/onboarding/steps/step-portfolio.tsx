'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'
import { Star, Trash2, UploadCloud, ImageIcon, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { UPLOAD_LIMITS } from '@castflow/validators'
import { useUploadFile, useDeletePortfolioItem, useSetPrimaryPortfolioItem } from '@/lib/hooks/use-uploads'
import { cn } from '@/lib/utils'
import { StepNav } from '../step-nav'
import type { MyArtistProfile } from '@/lib/api/artists'

interface StepPortfolioProps {
  profile: MyArtistProfile
  onBack: () => void
  onNext: () => void
}

interface PortfolioItem {
  id: string
  url: string
  type: 'photo' | 'video'
  caption: string | null
  isPrimary: boolean
}

const MIN_PHOTOS = 3
const ALLOWED_PHOTO_TYPES = UPLOAD_LIMITS.portfolio_photo.types
const MAX_PHOTO_MB = UPLOAD_LIMITS.portfolio_photo.maxSizeMb

function normaliseItems(profile: MyArtistProfile): PortfolioItem[] {
  return profile.portfolioItems
    .map((raw) => {
      const item = raw as {
        id?: string
        url?: string
        type?: string
        caption?: string | null
        isPrimary?: boolean
      }
      if (!item.id || !item.url) return null
      const type = item.type === 'video' ? 'video' : 'photo'
      return {
        id: item.id,
        url: item.url,
        type,
        caption: item.caption ?? null,
        isPrimary: Boolean(item.isPrimary),
      }
    })
    .filter((item): item is PortfolioItem => item !== null)
}

export function StepPortfolio({ profile, onBack, onNext }: StepPortfolioProps) {
  const items = normaliseItems(profile)
  const photoCount = items.filter((i) => i.type === 'photo').length

  const upload = useUploadFile()
  const del = useDeletePortfolioItem()
  const setPrimary = useSetPrimaryPortfolioItem()

  // Track which item IDs are currently being deleted so each card shows its own spinner
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const onDrop = (files: File[]) => {
    for (const file of files) {
      if (!ALLOWED_PHOTO_TYPES.includes(file.type as (typeof ALLOWED_PHOTO_TYPES)[number])) {
        toast.error(`${file.name} — unsupported file type`)
        continue
      }
      if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
        toast.error(`${file.name} — too large (max ${MAX_PHOTO_MB} MB)`)
        continue
      }
      upload.mutate(
        { file, type: 'portfolio_photo' },
        {
          onSuccess: () => toast.success(`${file.name} uploaded`),
        }
      )
    }
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
      onSettled: () => setDeletingIds((prev) => { const next = new Set(prev); next.delete(id); return next }),
    })
  }

  const handleSetPrimary = (id: string) => {
    setPrimary.mutate(id)
  }

  const canContinue = photoCount >= MIN_PHOTOS

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={cn(
          'cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition',
          isDragActive
            ? 'border-[#f9a26c]/70 bg-[#f9a26c]/[0.04]'
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
        {upload.isPending && (
          <p className="mt-2 text-xs text-[#f9a26c]">Uploading…</p>
        )}
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-white/55">
          <strong
            className={cn(canContinue ? 'text-[#f9a26c]' : 'text-rose-300')}
          >
            {photoCount}
          </strong>{' '}
          of {MIN_PHOTOS} minimum photos uploaded
        </span>
        <span className="text-white/40">
          Tip: include a headshot, a full-body, and one other
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-10 text-center">
          <ImageIcon className="h-6 w-6 text-white/40" />
          <p className="text-sm text-white/55">No photos yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
            Upload at least {MIN_PHOTOS} photos before continuing. This is enforced when
            you submit for review.
          </span>
        </div>
      )}

      <StepNav
        onBack={onBack}
        onNext={onNext}
        nextType="button"
        nextDisabled={!canContinue}
      />
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
    <div className="group relative aspect-square overflow-hidden rounded-xl border border-white/12 bg-white/[0.04]">
      <Image
        src={item.url}
        alt={item.caption ?? 'Portfolio item'}
        fill
        sizes="(min-width: 768px) 25vw, 50vw"
        className="object-cover"
      />
      {item.isPrimary ? (
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-[#f9a26c] px-2 py-0.5 text-[10px] font-medium text-[var(--ink-900)]">
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
  )
}
