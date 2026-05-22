'use client'

import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { AtSign, Sparkle, Stars, Trophy } from 'lucide-react'
import {
  artistExperienceSchema,
  type ArtistExperienceInput,
} from '@castflow/validators'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateExperience } from '@/lib/hooks/use-artist'
import { useBeforeUnloadWarning } from '@/lib/hooks/use-before-unload-warning'
import { cn } from '@/lib/utils'
import { StepNav } from '../step-nav'
import type { MyArtistProfile } from '@/lib/api/artists'

interface StepExperienceProps {
  profile: MyArtistProfile
  onBack: () => void
  onNext: () => void
}

const LEVELS = [
  {
    value: 'new_face' as const,
    label: 'New face',
    icon: Sparkle,
    blurb: 'Less than 1 year, building your portfolio.',
  },
  {
    value: 'semi_pro' as const,
    label: 'Semi-pro',
    icon: Stars,
    blurb: '1–3 years, regular paid work alongside other commitments.',
  },
  {
    value: 'professional' as const,
    label: 'Professional',
    icon: Trophy,
    blurb: '3+ years, this is your full-time craft.',
  },
]

interface ProfileWithRates extends MyArtistProfile {
  hourlyRate?: number | null
  halfDayRate?: number | null
  fullDayRate?: number | null
}

export function StepExperience({ profile, onBack, onNext }: StepExperienceProps) {
  const mutation = useUpdateExperience()
  const p = profile as ProfileWithRates
  const form = useForm<ArtistExperienceInput>({
    resolver: zodResolver(artistExperienceSchema),
    defaultValues: {
      experienceLevel:
        profile.experienceLevel ?? ('' as ArtistExperienceInput['experienceLevel']),
      instagramHandle: profile.instagramHandle ?? '',
      hourlyRate: p.hourlyRate ?? undefined,
      halfDayRate: p.halfDayRate ?? undefined,
      fullDayRate: p.fullDayRate ?? undefined,
    },
  })

  const selectedLevel = form.watch('experienceLevel')

  useBeforeUnloadWarning(form.formState.isDirty && !mutation.isPending)

  const onSubmit: SubmitHandler<ArtistExperienceInput> = (values) => {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success('Experience saved')
        onNext()
      },
    })
  }

  return (
    <form
      onSubmit={(e) => {
        void form.handleSubmit(onSubmit)(e)
      }}
      noValidate
      className="space-y-7"
    >
      <div className="space-y-3">
        <Label>Experience level</Label>
        <div className="grid gap-3 sm:grid-cols-3">
          {LEVELS.map((lvl) => {
            const Icon = lvl.icon
            const isSelected = selectedLevel === lvl.value
            return (
              <button
                key={lvl.value}
                type="button"
                onClick={() =>
                  form.setValue('experienceLevel', lvl.value, { shouldValidate: true })
                }
                className={cn(
                  'group flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition',
                  isSelected
                    ? 'border-[var(--cta-400)]/60 bg-[var(--cta-400)]/[0.06] ring-2 ring-[var(--cta-400)]/20'
                    : 'border-white/12 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 transition',
                    isSelected ? 'text-[var(--cta-400)]' : 'text-white/55'
                  )}
                />
                <span className="text-sm font-semibold tracking-tight text-white">
                  {lvl.label}
                </span>
                <span className="text-xs leading-relaxed text-white/55">{lvl.blurb}</span>
              </button>
            )
          })}
        </div>
        {form.formState.errors.experienceLevel && (
          <p className="text-destructive text-xs">
            {form.formState.errors.experienceLevel.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="instagramHandle">
          Instagram handle
          <span className="text-muted-foreground ml-1.5 text-xs font-normal">
            (optional)
          </span>
        </Label>
        <div className="relative">
          <AtSign className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            id="instagramHandle"
            placeholder="yourhandle"
            className="pl-9"
            {...form.register('instagramHandle', {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                e.target.value = e.target.value.replace(/^@+/, '')
              },
            })}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          Optional but encouraged — casters often peek before shortlisting.
        </p>
        {form.formState.errors.instagramHandle && (
          <p className="text-destructive text-xs">
            {form.formState.errors.instagramHandle.message}
          </p>
        )}
      </div>

      <fieldset className="space-y-3">
        <legend className="text-muted-foreground text-xs tracking-wide uppercase">
          Indicative rates (optional)
        </legend>
        <p className="text-muted-foreground -mt-1 text-xs">
          Leave blank to negotiate every job via bids. These never show publicly without
          your say-so.
        </p>
        <div className="grid gap-5 sm:grid-cols-3">
          <RateField
            id="hourlyRate"
            label="Hourly (£)"
            register={form.register('hourlyRate', {
              setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
            })}
          />
          <RateField
            id="halfDayRate"
            label="Half-day (£)"
            register={form.register('halfDayRate', {
              setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
            })}
          />
          <RateField
            id="fullDayRate"
            label="Full-day (£)"
            register={form.register('fullDayRate', {
              setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
            })}
          />
        </div>
      </fieldset>

      <StepNav onBack={onBack} isSubmitting={mutation.isPending} />
    </form>
  )
}

function RateField({
  id,
  label,
  register,
}: {
  id: string
  label: string
  register: ReturnType<ReturnType<typeof useForm>['register']>
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" inputMode="decimal" min="0" {...register} />
    </div>
  )
}
