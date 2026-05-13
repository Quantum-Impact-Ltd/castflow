'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ErrorState, LoadingState, PageHeader } from '@/components/dashboard'
import { CalendarFeedCard } from '@/components/settings/calendar-feed'
import { useMyCaster, useUpdateMyCaster } from '@/lib/hooks/use-caster'
import type { UpdateCasterInput } from '@/lib/api/caster'

export function CasterSettingsClient() {
  const me = useMyCaster()
  const update = useUpdateMyCaster()
  const form = useForm<UpdateCasterInput>()

  useEffect(() => {
    if (me.data) {
      form.reset({
        companyName: me.data.companyName,
        companyType: me.data.companyType,
        contactName: me.data.contactName,
        phone: me.data.phone ?? '',
        website: me.data.website ?? '',
      })
    }
  }, [me.data, form])

  if (me.isPending) return <LoadingState rows={5} />
  if (me.isError) return <ErrorState onRetry={() => me.refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Company profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit((v) => update.mutate(v))} className="space-y-4">
              <Field label="Company name">
                <Input {...form.register('companyName')} />
              </Field>
              <Field label="Company type">
                <Select
                  value={form.watch('companyType')}
                  onValueChange={(v) =>
                    form.setValue('companyType', v as UpdateCasterInput['companyType'])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brand">Brand</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                    <SelectItem value="production_house">Production house</SelectItem>
                    <SelectItem value="independent">Independent</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Contact name">
                <Input {...form.register('contactName')} />
              </Field>
              <Field label="Phone">
                <Input {...form.register('phone')} />
              </Field>
              <Field label="Website">
                <Input {...form.register('website')} />
              </Field>
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? 'Saving…' : 'Save'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <CalendarFeedCard />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">More</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm">
            <Button asChild variant="outline" size="sm">
              <Link href="/caster/settings/billing">Billing</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/caster/settings/notifications">Notifications</Link>
            </Button>
            <Button asChild variant="destructive" size="sm">
              <Link href="/caster/settings/delete">Delete account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
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
