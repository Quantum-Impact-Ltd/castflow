'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { artistPersonalInfoSchema, type ArtistPersonalInfoInput } from '@castflow/validators'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useMyArtistProfile, useUpdatePersonal } from '@/lib/hooks/use-artist'

const GENDER_OPTIONS = ['female', 'male', 'non_binary', 'prefer_not_to_say'] as const

export function PersonalForm() {
  const router = useRouter()
  const { data: profile, isLoading } = useMyArtistProfile()
  const mutation = useUpdatePersonal()

  const form = useForm<ArtistPersonalInfoInput>({
    resolver: zodResolver(artistPersonalInfoSchema),
    defaultValues: { dob: '', gender: '', pronouns: '', city: '', bio: '' },
  })

  useEffect(() => {
    if (!profile) return
    form.reset({
      dob: profile.dob ? profile.dob.slice(0, 10) : '',
      gender: profile.gender ?? '',
      pronouns: profile.pronouns ?? '',
      city: profile.city ?? '',
      bio: profile.bio ?? '',
    })
  }, [profile, form])

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading…</p>
  }

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(values, {
      onSuccess: () => {
        toast.success('Saved')
        router.push('/onboarding/stats')
      },
    })
  })

  return (
    <form
      onSubmit={(e) => {
        void onSubmit(e)
      }}
      className="space-y-4"
      noValidate
    >
      <div className="space-y-1.5">
        <Label htmlFor="dob">Date of birth</Label>
        <Input id="dob" type="date" {...form.register('dob')} />
        {form.formState.errors.dob && (
          <p className="text-destructive text-xs">{form.formState.errors.dob.message}</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="gender">Gender</Label>
          <select
            id="gender"
            {...form.register('gender')}
            className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Select…</option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g.replace('_', ' ')}
              </option>
            ))}
          </select>
          {form.formState.errors.gender && (
            <p className="text-destructive text-xs">{form.formState.errors.gender.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pronouns">Pronouns (optional)</Label>
          <Input id="pronouns" placeholder="she/her" {...form.register('pronouns')} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="city">City</Label>
        <Input id="city" placeholder="London" {...form.register('city')} />
        {form.formState.errors.city && (
          <p className="text-destructive text-xs">{form.formState.errors.city.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio (optional)</Label>
        <Textarea
          id="bio"
          rows={3}
          maxLength={300}
          placeholder="A short introduction (max 300 chars)"
          {...form.register('bio')}
        />
        {form.formState.errors.bio && (
          <p className="text-destructive text-xs">{form.formState.errors.bio.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving…' : 'Save and continue'}
        </Button>
      </div>
    </form>
  )
}
