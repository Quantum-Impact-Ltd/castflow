'use client'

import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import type { z } from 'zod'
import {
  modelStatsSchema,
  actorStatsSchema,
  type ModelStatsInput,
  type ActorStatsInput,
} from '@castflow/validators'

// actorStatsSchema uses .default(false) on equityMember; that makes the inferred
// OUTPUT type require it but the INPUT type allow it undefined. RHF resolvers
// type against the input, so we widen here to keep both forms happy.
type ActorStatsFormInput = z.input<typeof actorStatsSchema>
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUpdateModelStats, useUpdateActorStats } from '@/lib/hooks/use-artist'
import { cn } from '@/lib/utils'
import { StepNav } from '../step-nav'
import type { MyArtistProfile } from '@/lib/api/artists'

interface StepStatsProps {
  profile: MyArtistProfile
  onBack: () => void
  onNext: () => void
}

const HAIR_COLOURS = [
  'Black',
  'Dark brown',
  'Brown',
  'Light brown',
  'Blonde',
  'Red',
  'Auburn',
  'Grey',
  'White',
  'Other',
] as const

const EYE_COLOURS = [
  'Brown',
  'Dark brown',
  'Hazel',
  'Green',
  'Blue',
  'Grey',
  'Amber',
  'Other',
] as const

const SKIN_TONES = [
  { value: 'fair', label: 'Fair', swatch: '#F4D9C2' },
  { value: 'light', label: 'Light', swatch: '#E5BFA0' },
  { value: 'medium', label: 'Medium', swatch: '#C99776' },
  { value: 'olive', label: 'Olive', swatch: '#A37C56' },
  { value: 'tan', label: 'Tan', swatch: '#7A4F32' },
  { value: 'deep', label: 'Deep', swatch: '#4A2A18' },
] as const

export function StepStats({ profile, onBack, onNext }: StepStatsProps) {
  if (profile.artistType === 'model') {
    return <ModelStatsForm profile={profile} onBack={onBack} onNext={onNext} />
  }
  return <ActorStatsForm profile={profile} onBack={onBack} onNext={onNext} />
}

function ModelStatsForm({ profile, onBack, onNext }: StepStatsProps) {
  const existing = (profile.modelStats ?? {}) as Partial<ModelStatsInput>
  const mutation = useUpdateModelStats()

  const form = useForm<ModelStatsInput>({
    resolver: zodResolver(modelStatsSchema),
    defaultValues: {
      heightCm: existing.heightCm ?? ('' as unknown as number),
      weightKg: existing.weightKg ?? undefined,
      dressSize: existing.dressSize ?? '',
      shoeSize: existing.shoeSize ?? '',
      bustCm: existing.bustCm ?? undefined,
      waistCm: existing.waistCm ?? undefined,
      hipCm: existing.hipCm ?? undefined,
      hairColour: existing.hairColour ?? '',
      eyeColour: existing.eyeColour ?? '',
      skinTone: existing.skinTone ?? ('' as ModelStatsInput['skinTone']),
    },
  })

  const skinTone = form.watch('skinTone')

  const onSubmit: SubmitHandler<ModelStatsInput> = (values) => {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success('Stats saved')
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
      className="space-y-6"
    >
      <div className="grid gap-5 sm:grid-cols-3">
        <NumberField
          id="heightCm"
          label="Height (cm)"
          register={form.register('heightCm', { valueAsNumber: true })}
          error={form.formState.errors.heightCm?.message}
        />
        <TextField
          id="dressSize"
          label="Dress size"
          placeholder="e.g. UK 8"
          register={form.register('dressSize')}
          error={form.formState.errors.dressSize?.message}
        />
        <TextField
          id="shoeSize"
          label="Shoe size"
          placeholder="e.g. UK 5"
          register={form.register('shoeSize')}
          error={form.formState.errors.shoeSize?.message}
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-muted-foreground text-xs tracking-wide uppercase">
          Measurements (optional)
        </legend>
        <div className="grid gap-5 sm:grid-cols-4">
          <NumberField
            id="weightKg"
            label="Weight (kg)"
            register={form.register('weightKg', {
              setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
            })}
          />
          <NumberField
            id="bustCm"
            label="Bust (cm)"
            register={form.register('bustCm', {
              setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
            })}
          />
          <NumberField
            id="waistCm"
            label="Waist (cm)"
            register={form.register('waistCm', {
              setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
            })}
          />
          <NumberField
            id="hipCm"
            label="Hip (cm)"
            register={form.register('hipCm', {
              setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
            })}
          />
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          id="hairColour"
          label="Hair colour"
          value={form.watch('hairColour')}
          onChange={(v) => form.setValue('hairColour', v, { shouldValidate: true })}
          options={HAIR_COLOURS.map((c) => ({ value: c, label: c }))}
          error={form.formState.errors.hairColour?.message}
        />
        <SelectField
          id="eyeColour"
          label="Eye colour"
          value={form.watch('eyeColour')}
          onChange={(v) => form.setValue('eyeColour', v, { shouldValidate: true })}
          options={EYE_COLOURS.map((c) => ({ value: c, label: c }))}
          error={form.formState.errors.eyeColour?.message}
        />
      </div>

      <div className="space-y-2">
        <Label>Skin tone</Label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {SKIN_TONES.map((s) => {
            const isSelected = skinTone === s.value
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => form.setValue('skinTone', s.value, { shouldValidate: true })}
                className={cn(
                  'group flex flex-col items-center gap-2 rounded-xl border p-3 transition backdrop-blur-xl',
                  isSelected
                    ? 'border-[#f9a26c]/60 bg-[#f9a26c]/[0.06] ring-2 ring-[#f9a26c]/20'
                    : 'border-white/12 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]'
                )}
              >
                <div
                  className="h-10 w-10 rounded-full ring-1 ring-white/10"
                  style={{ backgroundColor: s.swatch }}
                />
                <span className="text-xs text-white/75">{s.label}</span>
              </button>
            )
          })}
        </div>
        {form.formState.errors.skinTone && (
          <p className="text-destructive text-xs">{form.formState.errors.skinTone.message}</p>
        )}
      </div>

      <StepNav onBack={onBack} isSubmitting={mutation.isPending} />
    </form>
  )
}

function ActorStatsForm({ profile, onBack, onNext }: StepStatsProps) {
  const existing = (profile.actorStats ?? {}) as Partial<ActorStatsInput>
  const mutation = useUpdateActorStats()

  const form = useForm<ActorStatsFormInput>({
    resolver: zodResolver(actorStatsSchema),
    defaultValues: {
      heightCm: existing.heightCm ?? ('' as unknown as number),
      hairColour: existing.hairColour ?? '',
      eyeColour: existing.eyeColour ?? '',
      voiceType: existing.voiceType ?? '',
      spotlightUrl: existing.spotlightUrl ?? '',
      equityMember: existing.equityMember ?? false,
      ageRangeMin: existing.ageRangeMin ?? ('' as unknown as number),
      ageRangeMax: existing.ageRangeMax ?? ('' as unknown as number),
    },
  })

  const onSubmit: SubmitHandler<ActorStatsFormInput> = (values) => {
    // Zod default fills in equityMember on parse — narrowing happens at the
    // service boundary, not here.
    mutation.mutate(values as ActorStatsInput, {
      onSuccess: () => {
        toast.success('Stats saved')
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
      className="space-y-6"
    >
      <div className="grid gap-5 sm:grid-cols-3">
        <NumberField
          id="heightCm"
          label="Height (cm)"
          register={form.register('heightCm', { valueAsNumber: true })}
          error={form.formState.errors.heightCm?.message}
        />
        <SelectField
          id="hairColour"
          label="Hair colour"
          value={form.watch('hairColour')}
          onChange={(v) => form.setValue('hairColour', v, { shouldValidate: true })}
          options={HAIR_COLOURS.map((c) => ({ value: c, label: c }))}
          error={form.formState.errors.hairColour?.message}
        />
        <SelectField
          id="eyeColour"
          label="Eye colour"
          value={form.watch('eyeColour')}
          onChange={(v) => form.setValue('eyeColour', v, { shouldValidate: true })}
          options={EYE_COLOURS.map((c) => ({ value: c, label: c }))}
          error={form.formState.errors.eyeColour?.message}
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-muted-foreground text-xs tracking-wide uppercase">
          Playable age range
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField
            id="ageRangeMin"
            label="Minimum age"
            register={form.register('ageRangeMin', { valueAsNumber: true })}
            error={form.formState.errors.ageRangeMin?.message}
          />
          <NumberField
            id="ageRangeMax"
            label="Maximum age"
            register={form.register('ageRangeMax', { valueAsNumber: true })}
            error={form.formState.errors.ageRangeMax?.message}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          The age range you can plausibly play on screen — usually 5-10 years either side of
          your actual age.
        </p>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="voiceType"
          label="Voice type (optional)"
          placeholder="e.g. Tenor, Soprano, Baritone"
          register={form.register('voiceType')}
        />
        <TextField
          id="spotlightUrl"
          label="Spotlight URL (optional)"
          placeholder="https://www.spotlight.com/..."
          register={form.register('spotlightUrl')}
          error={form.formState.errors.spotlightUrl?.message}
        />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-white/12 bg-white/[0.03] p-4 backdrop-blur-xl">
        <div className="space-y-0.5">
          <Label htmlFor="equityMember" className="text-white/85">
            Equity member
          </Label>
          <p className="text-xs text-white/55">
            Member of the UK actors&apos; trade union.
          </p>
        </div>
        <Switch
          id="equityMember"
          checked={form.watch('equityMember')}
          onCheckedChange={(checked) => form.setValue('equityMember', checked)}
        />
      </div>

      <StepNav onBack={onBack} isSubmitting={mutation.isPending} />
    </form>
  )
}

// ── Small field helpers — keep the parent forms readable ───────────────────

function TextField({
  id,
  label,
  placeholder,
  register,
  error,
}: {
  id: string
  label: string
  placeholder?: string
  register: ReturnType<ReturnType<typeof useForm>['register']>
  error?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} placeholder={placeholder} {...register} />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}

function NumberField({
  id,
  label,
  register,
  error,
}: {
  id: string
  label: string
  register: ReturnType<ReturnType<typeof useForm>['register']>
  error?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" inputMode="numeric" {...register} />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  error,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  options: ReadonlyArray<{ value: string; label: string }>
  error?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}
