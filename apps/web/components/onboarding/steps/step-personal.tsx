'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { artistPersonalInfoSchema, type ArtistPersonalInfoInput } from '@castflow/validators'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUpdatePersonal } from '@/lib/hooks/use-artist'
import { StepNav } from '../step-nav'
import type { MyArtistProfile } from '@/lib/api/artists'

interface StepPersonalProps {
  profile: MyArtistProfile
  onBack: () => void
  onNext: () => void
}

const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const

const dobMax = (() => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 18)
  return d.toISOString().slice(0, 10)
})()

export function StepPersonal({ profile, onBack, onNext }: StepPersonalProps) {
  const mutation = useUpdatePersonal()
  const form = useForm<ArtistPersonalInfoInput>({
    resolver: zodResolver(artistPersonalInfoSchema),
    defaultValues: {
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      dob: profile.dob ? profile.dob.slice(0, 10) : '',
      gender: profile.gender ?? '',
      pronouns: profile.pronouns ?? '',
      city: profile.city ?? '',
      bio: profile.bio ?? '',
    },
  })

  const bio = form.watch('bio') ?? ''

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success('Saved')
        onNext()
      },
    })
  })

  return (
    <form
      onSubmit={(e) => {
        void onSubmit(e)
      }}
      noValidate
      className="space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" autoComplete="given-name" autoFocus {...form.register('firstName')} />
          {form.formState.errors.firstName && (
            <p className="text-destructive text-xs">
              {form.formState.errors.firstName.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" autoComplete="family-name" {...form.register('lastName')} />
          {form.formState.errors.lastName && (
            <p className="text-destructive text-xs">
              {form.formState.errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="dob">Date of birth</Label>
          <Input id="dob" type="date" max={dobMax} {...form.register('dob')} />
          <p className="text-muted-foreground text-xs">
            You must be 18 or older to join CastFlow.
          </p>
          {form.formState.errors.dob && (
            <p className="text-destructive text-xs">{form.formState.errors.dob.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={form.watch('gender')}
            onValueChange={(v) => form.setValue('gender', v, { shouldValidate: true })}
          >
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {GENDER_OPTIONS.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.gender && (
            <p className="text-destructive text-xs">
              {form.formState.errors.gender.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pronouns">Pronouns</Label>
          <Input id="pronouns" placeholder="she/her, they/them…" {...form.register('pronouns')} />
          <p className="text-muted-foreground text-xs">Optional. Shown on your profile.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" placeholder="London" {...form.register('city')} />
          {form.formState.errors.city && (
            <p className="text-destructive text-xs">{form.formState.errors.city.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-end justify-between gap-2">
          <Label htmlFor="bio">Bio</Label>
          <span className="text-muted-foreground text-xs tabular-nums">
            {bio.length} / 300
          </span>
        </div>
        <Textarea
          id="bio"
          rows={4}
          maxLength={300}
          placeholder="A short introduction — what you bring to a shoot, the work you love, the brands you'd love to work with."
          {...form.register('bio')}
        />
        <p className="text-muted-foreground text-xs">
          Optional but recommended — casters skim bios when shortlisting.
        </p>
        {form.formState.errors.bio && (
          <p className="text-destructive text-xs">{form.formState.errors.bio.message}</p>
        )}
      </div>

      <StepNav onBack={onBack} isSubmitting={mutation.isPending} />
    </form>
  )
}
