'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { artistPersonalInfoSchema, type ArtistPersonalInfoInput } from '@castflow/validators'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ErrorState, LoadingState, PageHeader } from '@/components/dashboard'
import { useMyArtistProfile, useUpdatePersonal } from '@/lib/hooks/use-artist'

export function ProfileEditClient() {
  const profile = useMyArtistProfile()
  const update = useUpdatePersonal()
  const form = useForm<ArtistPersonalInfoInput>({
    resolver: zodResolver(artistPersonalInfoSchema),
  })

  useEffect(() => {
    if (profile.data) {
      form.reset({
        dob: profile.data.dob ?? '',
        gender: profile.data.gender ?? 'female',
        pronouns: profile.data.pronouns ?? '',
        city: profile.data.city ?? '',
        bio: profile.data.bio ?? '',
      } as ArtistPersonalInfoInput)
    }
  }, [profile.data, form])

  if (profile.isPending) return <LoadingState rows={5} />
  if (profile.isError) return <ErrorState onRetry={() => profile.refetch()} />

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Edit profile" />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal info</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((v) => update.mutate(v))}
            className="grid grid-cols-2 gap-4"
          >
            <Field label="DOB">
              <Input type="date" {...form.register('dob')} />
            </Field>
            <Field label="Gender">
              <Input {...form.register('gender')} />
            </Field>
            <Field label="City">
              <Input {...form.register('city')} />
            </Field>
            <Field label="Pronouns">
              <Input {...form.register('pronouns')} />
            </Field>
            <Field label="Bio" className="col-span-2">
              <Textarea rows={5} {...form.register('bio')} />
            </Field>
            <div className="col-span-2 flex justify-end">
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}
