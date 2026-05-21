'use client'

import { useRef, useState } from 'react'
import { CheckCircle2, Lock, UploadCloud, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { UPLOAD_LIMITS } from '@castflow/validators'
import { useUploadFile } from '@/lib/hooks/use-uploads'
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
  const inputRef = useRef<HTMLInputElement>(null)
  const [lastUploadedName, setLastUploadedName] = useState<string | null>(null)

  const hasDocument = Boolean(profile.idDocumentUrl)

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

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-white/12 bg-white/[0.03] p-4 backdrop-blur-xl">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[#f9a26c]" />
        <div className="space-y-1 text-sm">
          <p className="font-medium text-white">Your ID is private</p>
          <p className="leading-relaxed text-white/60">
            Stored encrypted and only visible to CastFlow admins for verification. It is
            never shared with casters or shown on your public profile.
          </p>
        </div>
      </div>

      {hasDocument && !upload.isPending && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-400/30 bg-emerald-400/[0.06] p-4 backdrop-blur-xl">
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
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-white/75 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Replace
          </button>
        </div>
      )}

      {!hasDocument && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className="w-full cursor-pointer rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-10 text-center transition hover:border-white/30 hover:bg-white/[0.04] disabled:cursor-wait disabled:opacity-60"
        >
          <UploadCloud className="mx-auto mb-3 h-8 w-8 text-white/55" />
          <p className="text-sm font-medium text-white">
            {upload.isPending ? 'Uploading…' : 'Upload your ID'}
          </p>
          <p className="mt-1 text-xs text-white/50">
            Passport or UK driving licence · JPG, PNG, or PDF · max {MAX_MB} MB
          </p>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

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
