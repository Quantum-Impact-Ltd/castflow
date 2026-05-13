'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ErrorState, LoadingState, PageHeader } from '@/components/dashboard'
import { useJob, useUpdateJob } from '@/lib/hooks/use-jobs'

interface EditValues {
  title: string
  description: string
  locationCity: string
  shootDate: string
  applicationDeadline: string
  usageRights: string
  rateAmount?: number
}

export function CasterJobEditClient({ id }: { id: string }) {
  const router = useRouter()
  const job = useJob(id)
  const update = useUpdateJob(id)
  const form = useForm<EditValues>()

  useEffect(() => {
    if (job.data) {
      form.reset({
        title: job.data.title,
        description: job.data.description,
        locationCity: job.data.locationCity,
        shootDate: job.data.shootDate,
        applicationDeadline: job.data.applicationDeadline,
        usageRights: job.data.usageRights,
        ...(job.data.rateAmount != null ? { rateAmount: job.data.rateAmount } : {}),
      })
    }
  }, [job.data, form])

  if (job.isPending) return <LoadingState rows={5} />
  if (job.isError) return <ErrorState onRetry={() => job.refetch()} />

  async function onSubmit(values: EditValues) {
    await update.mutateAsync(values as never)
    router.push(`/caster/jobs/${id}`)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Edit job" />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Update details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Title">
              <Input {...form.register('title')} />
            </Field>
            <Field label="Description">
              <Textarea rows={6} {...form.register('description')} />
            </Field>
            <Field label="City">
              <Input {...form.register('locationCity')} />
            </Field>
            <Field label="Shoot date">
              <Input type="datetime-local" {...form.register('shootDate')} />
            </Field>
            <Field label="Application deadline">
              <Input type="datetime-local" {...form.register('applicationDeadline')} />
            </Field>
            <Field label="Rate amount">
              <Input
                type="number"
                step="0.01"
                {...form.register('rateAmount', { valueAsNumber: true })}
              />
            </Field>
            <Field label="Usage rights">
              <Textarea rows={3} {...form.register('usageRights')} />
            </Field>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
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
