'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { CheckCircle2, FileText, Lock, UploadCloud, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { UPLOAD_LIMITS } from '@castflow/validators'
import { useUploadFile } from '@/lib/hooks/use-uploads'
import { useMyIdDocumentUrl } from '@/lib/hooks/use-artist'
import { cn } from '@/lib/utils'
import { StepNav } from '../step-nav'
import type { MyArtistProfile } from '@/lib/api/artists'

interface StepIdentityProps {
  profile: MyArtistProfile
  onBack: () => void
  onNext: () => void
}

const ALLOWED_TYPES = UPLOAD_LIMITS.id_document.types
const MAX_MB = UPLOAD_LIMITS.id_document.maxSizeMb

export function StepIdentity({ profile, onBack, onNext }: StepIdentityProps) {
  const upload = useUploadFile()
  const [lastUploadedName, setLastUploadedName] = useState<string | null>(null)

  const hasDocument = Boolean(profile.idDocumentUrl)
  // Short-lived presigned URL so the artist can confirm they uploaded the
  // right file. Only fetched when a document exists. (Audit H14.)
  const idUrlQuery = useMyIdDocumentUrl(hasDocument)

  const handleFile = (file: File | null) => {
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
      toast.error('Unsupported file type. Use JPG, PNG, or PDF.')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File too large. Max ${MAX_MB} MB.`)
      return
    }
    upload.mutate(
      { file, type: 'id_document' },
      {
        onSuccess: () => {
          setLastUploadedName(file.name)
          toast.success('ID document uploaded — only admin can view it.')
        },
      }
    )
  }

  // Single-file dropzone to match the portfolio step's UX (Audit M18).
  // Click-to-browse still works; drag-and-drop is the new affordance.
  const dropzone = useDropzone({
    onDrop: (files) => handleFile(files[0] ?? null),
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'application/pdf': [],
    },
    multiple: false,
    maxSize: MAX_MB * 1024 * 1024,
    disabled: upload.isPending,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-white/12 bg-white/[0.03] p-4 backdrop-blur-xl">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[var(--cta-400)]" />
        <div className="space-y-1 text-sm">
          <p className="font-medium text-white">Your ID is private</p>
          <p className="leading-relaxed text-white/60">
            Stored encrypted and only visible to CastFlow admins for verification. It is
            never shared with casters or shown on your public profile.
          </p>
        </div>
      </div>

      {hasDocument && !upload.isPending && (
        <div className="space-y-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.06] p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              <div className="text-sm">
                <p className="font-medium text-white">Document received</p>
                <p className="text-xs text-white/55">
                  {lastUploadedName ?? 'Awaiting admin review'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={dropzone.open}
              disabled={upload.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-white/75 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Replace
            </button>
          </div>

          {/* Preview so the artist can confirm they uploaded the right thing
              (right side of passport, non-blurry, etc.) instead of finding
              out via admin rejection a day later. (Audit H14.) */}
          {idUrlQuery.isPending ? (
            <div className="h-32 animate-pulse rounded-xl bg-white/[0.03]" />
          ) : idUrlQuery.data?.contentTypeHint === 'image' ? (
            // Browser auth not needed — the URL is presigned.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={idUrlQuery.data.url}
              alt="Your uploaded ID document"
              className="max-h-64 w-full rounded-xl border border-white/12 bg-black/40 object-contain"
            />
          ) : idUrlQuery.data ? (
            <a
              href={idUrlQuery.data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-xs text-white/85 transition hover:bg-white/[0.08]"
            >
              <FileText className="h-3.5 w-3.5" />
              View document (PDF)
            </a>
          ) : null}
        </div>
      )}

      {!hasDocument && (
        <div
          {...dropzone.getRootProps()}
          className={cn(
            'w-full cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition',
            dropzone.isDragActive
              ? 'border-[var(--cta-400)]/70 bg-[var(--cta-400)]/[0.04]'
              : 'border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]',
            upload.isPending && 'cursor-wait opacity-60',
          )}
        >
          <input {...dropzone.getInputProps()} />
          <UploadCloud className="mx-auto mb-3 h-8 w-8 text-white/55" />
          <p className="text-sm font-medium text-white">
            {upload.isPending
              ? 'Uploading…'
              : dropzone.isDragActive
                ? 'Drop to upload'
                : 'Drag your ID here, or click to browse'}
          </p>
          <p className="mt-1 text-xs text-white/50">
            Passport or UK driving licence · JPG, PNG, or PDF · max {MAX_MB} MB
          </p>
        </div>
      )}

      <div className="space-y-2 text-xs leading-relaxed text-white/55">
        <p>
          <strong className="text-white/85">What we check:</strong> name on the document
          matches your profile, date of birth confirms you&apos;re 18+, and the image is
          clear enough to read.
        </p>
        <p>
          <strong className="text-white/85">What we don&apos;t do:</strong> we never run
          credit checks, share your document with third parties, or store it longer than
          legally required.
        </p>
      </div>

      <StepNav
        onBack={onBack}
        onNext={onNext}
        nextType="button"
        nextDisabled={!hasDocument || upload.isPending}
      />
    </div>
  )
}
