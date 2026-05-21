'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Globe, ImageIcon, Phone, Trash2, UploadCloud } from 'lucide-react'
import type { CasterProfile } from '@castflow/types'
import { UPLOAD_LIMITS } from '@castflow/validators'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateMyCaster, useMyCaster } from '@/lib/hooks/use-caster'
import { useUploadFile } from '@/lib/hooks/use-uploads'
import { useBeforeUnloadWarning } from '@/lib/hooks/use-before-unload-warning'
import { cn } from '@/lib/utils'
import { StepNav } from '../step-nav'

const LOGO_LIMITS = UPLOAD_LIMITS.caster_logo

interface StepCasterCompanyProps {
  profile: CasterProfile
  onSkip: () => void
  onNext: () => void
}

const schema = z.object({
  phone: z.string().max(30).optional().or(z.literal('')),
  website: z.string().url('Enter a valid URL').optional().or(z.literal('')),
})

type FormInput = z.infer<typeof schema>

export function StepCasterCompany({ profile, onSkip, onNext }: StepCasterCompanyProps) {
  const mutation = useUpdateMyCaster()
  // Re-fetch the profile after a logo upload so the preview reflects the
  // new URL without forcing a hard reload. (Audit M23.)
  const myCaster = useMyCaster()
  const upload = useUploadFile()
  const currentLogo =
    (myCaster.data as { logoUrl?: string | null } | undefined)?.logoUrl ??
    (profile as { logoUrl?: string | null }).logoUrl ??
    null
  const [logoUploadProgress, setLogoUploadProgress] = useState(0)

  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: profile.phone ?? '',
      website: profile.website ?? '',
    },
  })

  useBeforeUnloadWarning(form.formState.isDirty && !mutation.isPending)

  const onLogoDrop = (files: File[]) => {
    const file = files[0]
    if (!file) return
    setLogoUploadProgress(0)
    upload.mutate(
      {
        file,
        type: 'caster_logo',
        onProgress: setLogoUploadProgress,
      },
      {
        onSuccess: () => {
          void myCaster.refetch()
          toast.success('Logo uploaded')
        },
      },
    )
  }

  const onRemoveLogo = () => {
    mutation.mutate({ logoUrl: null }, { onSuccess: () => void myCaster.refetch() })
  }

  const logoDropzone = useDropzone({
    onDrop: onLogoDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
      'image/svg+xml': [],
    },
    multiple: false,
    maxSize: LOGO_LIMITS.maxSizeMb * 1024 * 1024,
    disabled: upload.isPending,
  })

  const onSubmit: SubmitHandler<FormInput> = (values) => {
    mutation.mutate(
      {
        phone: values.phone === '' ? null : values.phone,
        website: values.website === '' ? null : values.website,
      },
      {
        onSuccess: () => {
          toast.success('Saved')
          onNext()
        },
      }
    )
  }

  return (
    <form
      onSubmit={(e) => {
        void form.handleSubmit(onSubmit)(e)
      }}
      noValidate
      className="space-y-5"
    >
      <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 text-sm backdrop-blur-xl">
        <p className="font-medium text-white">
          Signed in as <span className="text-[var(--cta-400)]">{profile.companyName}</span>
        </p>
        <p className="text-xs text-white/55">
          {profile.contactName} ·{' '}
          {profile.companyType
            .replace('_', ' ')
            .replace(/^\w/, (c) => c.toUpperCase())}
        </p>
      </div>

      {/* Company logo (Audit M23) — sits above the contact fields because
       *  artists see it on the job feed and it materially influences whether
       *  they bid. Optional; the StepNav still allows "Skip for now". */}
      <div className="space-y-1.5">
        <Label>Company logo</Label>
        {currentLogo ? (
          <div className="flex items-center gap-4 rounded-2xl border border-white/12 bg-white/[0.03] p-3 backdrop-blur-xl">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/12 bg-white/[0.04]">
              <Image
                src={currentLogo}
                alt={`${profile.companyName} logo`}
                fill
                sizes="64px"
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="flex-1 text-xs text-white/55">
              Shown on your profile and on every job you post.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={logoDropzone.open}
                disabled={upload.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-white/75 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                Replace
              </button>
              <button
                type="button"
                onClick={onRemoveLogo}
                disabled={mutation.isPending}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/55 transition hover:bg-rose-400/[0.1] hover:text-rose-200 disabled:opacity-50"
                aria-label="Remove logo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div
            {...logoDropzone.getRootProps()}
            className={cn(
              'cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition',
              logoDropzone.isDragActive
                ? 'border-[var(--cta-400)]/70 bg-[var(--cta-400)]/[0.04]'
                : 'border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]',
              upload.isPending && 'cursor-wait opacity-60',
            )}
          >
            <input {...logoDropzone.getInputProps()} />
            <ImageIcon className="mx-auto mb-2 h-6 w-6 text-white/55" />
            <p className="text-xs font-medium text-white">
              {upload.isPending
                ? `Uploading… ${logoUploadProgress}%`
                : logoDropzone.isDragActive
                  ? 'Drop to upload'
                  : 'Drag a logo here, or click to browse'}
            </p>
            <p className="mt-1 text-[10px] text-white/45">
              PNG, JPG, WebP, or SVG · max {LOGO_LIMITS.maxSizeMb} MB
            </p>
          </div>
        )}
        <p className="text-muted-foreground text-xs">
          Optional, but artists are more likely to bid on jobs from brands
          they recognise.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <div className="relative">
          <Phone className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            id="phone"
            type="tel"
            placeholder="+44 20 7946 0958"
            className="pl-9"
            {...form.register('phone')}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          Optional. Shown to artists only after a booking is confirmed.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="website">Website</Label>
        <div className="relative">
          <Globe className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            id="website"
            type="url"
            placeholder="https://yourcompany.co.uk"
            className="pl-9"
            {...form.register('website')}
          />
        </div>
        {form.formState.errors.website && (
          <p className="text-destructive text-xs">{form.formState.errors.website.message}</p>
        )}
        <p className="text-muted-foreground text-xs">
          Optional. Helps build credibility with artists you invite.
        </p>
      </div>

      <StepNav onSkip={onSkip} isSubmitting={mutation.isPending} />
    </form>
  )
}
