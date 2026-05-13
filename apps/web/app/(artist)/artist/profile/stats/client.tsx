'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorState, LoadingState, PageHeader } from '@/components/dashboard'
import {
  useMyArtistProfile,
  useUpdateActorStats,
  useUpdateModelStats,
} from '@/lib/hooks/use-artist'

export function StatsEditClient() {
  const profile = useMyArtistProfile()
  const updateModel = useUpdateModelStats()
  const updateActor = useUpdateActorStats()

  if (profile.isPending) return <LoadingState rows={5} />
  if (profile.isError || !profile.data) return <ErrorState onRetry={() => profile.refetch()} />

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Edit stats" />
      <Card>
        <CardHeader>
          <CardTitle className="text-base capitalize">{profile.data.artistType} stats</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.data.artistType === 'model' ? (
            <ModelStatsForm
              initial={profile.data.modelStats ?? {}}
              onSubmit={(v) => updateModel.mutate(v as never)}
              loading={updateModel.isPending}
            />
          ) : (
            <ActorStatsForm
              initial={profile.data.actorStats ?? {}}
              onSubmit={(v) => updateActor.mutate(v as never)}
              loading={updateActor.isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ModelStatsForm({
  initial,
  onSubmit,
  loading,
}: {
  initial: Record<string, unknown>
  onSubmit: (v: Record<string, unknown>) => void
  loading: boolean
}) {
  const form = useForm<Record<string, unknown>>()
  useEffect(() => form.reset(initial), [initial, form])
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
      <Field label="Height (cm)">
        <Input type="number" {...form.register('heightCm', { valueAsNumber: true })} />
      </Field>
      <Field label="Dress size">
        <Input {...form.register('dressSize')} />
      </Field>
      <Field label="Shoe size">
        <Input {...form.register('shoeSize')} />
      </Field>
      <Field label="Hair colour">
        <Input {...form.register('hairColour')} />
      </Field>
      <Field label="Eye colour">
        <Input {...form.register('eyeColour')} />
      </Field>
      <Field label="Skin tone">
        <Input
          {...form.register('skinTone')}
          placeholder="fair / light / medium / olive / tan / deep"
        />
      </Field>
      <div className="col-span-2 flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Save stats'}
        </Button>
      </div>
    </form>
  )
}

function ActorStatsForm({
  initial,
  onSubmit,
  loading,
}: {
  initial: Record<string, unknown>
  onSubmit: (v: Record<string, unknown>) => void
  loading: boolean
}) {
  const form = useForm<Record<string, unknown>>()
  useEffect(() => form.reset(initial), [initial, form])
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
      <Field label="Height (cm)">
        <Input type="number" {...form.register('heightCm', { valueAsNumber: true })} />
      </Field>
      <Field label="Hair colour">
        <Input {...form.register('hairColour')} />
      </Field>
      <Field label="Eye colour">
        <Input {...form.register('eyeColour')} />
      </Field>
      <Field label="Voice type">
        <Input {...form.register('voiceType')} />
      </Field>
      <Field label="Spotlight URL">
        <Input {...form.register('spotlightUrl')} />
      </Field>
      <Field label="Equity member">
        <Input type="checkbox" {...form.register('equityMember')} />
      </Field>
      <Field label="Age range min">
        <Input type="number" {...form.register('ageRangeMin', { valueAsNumber: true })} />
      </Field>
      <Field label="Age range max">
        <Input type="number" {...form.register('ageRangeMax', { valueAsNumber: true })} />
      </Field>
      <div className="col-span-2 flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Save stats'}
        </Button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
