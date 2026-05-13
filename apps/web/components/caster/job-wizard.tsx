'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createJobSchema, type CreateJobInput } from '@castflow/validators'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { PageHeader } from '@/components/dashboard'
import { useCreateJob } from '@/lib/hooks/use-jobs'
import { formatCurrency } from '@/lib/utils'

const STEPS = [
  { id: 1, label: 'Basics' },
  { id: 2, label: 'Requirements' },
  { id: 3, label: 'Shoot' },
  { id: 4, label: 'Legal' },
  { id: 5, label: 'Visibility' },
  { id: 6, label: 'Review' },
]

const STEP_FIELDS: Record<number, Array<keyof CreateJobInput>> = {
  1: ['title', 'description', 'category', 'subcategory'],
  2: ['genderRequired', 'ageMin', 'ageMax', 'locationCity', 'skillsRequired'],
  3: [
    'shootDate',
    'shootDurationHours',
    'paymentType',
    'rateSetBy',
    'rateAmount',
    'headcountRequired',
    'applicationDeadline',
  ],
  4: ['requiresNda', 'exclusivity', 'usageRights'],
  5: ['visibility'],
  6: [],
}

export function JobWizard() {
  const router = useRouter()
  const create = useCreateJob()
  const [step, setStep] = useState(1)

  const form = useForm<CreateJobInput, unknown, CreateJobInput>({
    // zod's default('public') makes the resolver's inferred output diverge
    // from CreateJobInput's required visibility; cast bypasses the noise.
    resolver: zodResolver(createJobSchema) as never,
    defaultValues: {
      title: '',
      description: '',
      category: 'model',
      visibility: 'public',
      genderRequired: 'any',
      locationCity: '',
      skillsRequired: [],
      shootDurationHours: 4,
      paymentType: 'fixed',
      rateSetBy: 'caster',
      headcountRequired: 1,
      requiresNda: false,
      exclusivity: false,
      usageRights: '',
    } as Partial<CreateJobInput> as CreateJobInput,
  })

  async function handleNext() {
    const fields = STEP_FIELDS[step]
    if (fields && fields.length) {
      const ok = await form.trigger(fields)
      if (!ok) return
    }
    setStep((s) => Math.min(6, s + 1))
  }

  async function handleSubmit() {
    const values = form.getValues()
    const job = await create.mutateAsync(values)
    router.push(`/caster/jobs/${job.id}`)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Post a new job"
        description={`Step ${step} of 6 — ${STEPS[step - 1]?.label}`}
      />

      <Card>
        <CardContent className="pt-6">
          <ol className="mb-6 flex flex-wrap gap-2">
            {STEPS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setStep(s.id)}
                  className={`rounded-md border px-3 py-1 text-xs ${
                    step === s.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {s.id}. {s.label}
                </button>
              </li>
            ))}
          </ol>

          {step === 1 ? <StepBasics form={form} /> : null}
          {step === 2 ? <StepRequirements form={form} /> : null}
          {step === 3 ? <StepShoot form={form} /> : null}
          {step === 4 ? <StepLegal form={form} /> : null}
          {step === 5 ? <StepVisibility form={form} /> : null}
          {step === 6 ? <StepReview values={form.getValues()} /> : null}

          <div className="border-border mt-6 flex justify-between border-t pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
            >
              Back
            </Button>
            {step < 6 ? (
              <Button type="button" onClick={handleNext}>
                Continue
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={create.isPending}>
                {create.isPending ? 'Posting…' : 'Post job'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

type WizardForm = UseFormReturn<CreateJobInput, unknown, CreateJobInput>

function StepBasics({ form }: { form: WizardForm }) {
  return (
    <div className="space-y-4">
      <CardHeader className="px-0">
        <CardTitle className="text-base">Job basics</CardTitle>
      </CardHeader>
      <Field label="Job title" error={form.formState.errors.title?.message}>
        <Input {...form.register('title')} placeholder="e.g. Female model for summer campaign" />
      </Field>
      <Field label="Category" error={form.formState.errors.category?.message}>
        <Select
          value={form.watch('category')}
          onValueChange={(v) => form.setValue('category', v as CreateJobInput['category'])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="model">Model</SelectItem>
            <SelectItem value="actor">Actor</SelectItem>
            <SelectItem value="voiceover">Voiceover</SelectItem>
            <SelectItem value="extra">Extra</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Subcategory">
        <Input
          {...form.register('subcategory')}
          placeholder="Fashion / Commercial / Editorial / TVC / Other"
        />
      </Field>
      <Field label="Description" error={form.formState.errors.description?.message}>
        <Textarea
          rows={6}
          {...form.register('description')}
          placeholder="Describe the brand, mood, references."
        />
      </Field>
    </div>
  )
}

function StepRequirements({ form }: { form: WizardForm }) {
  return (
    <div className="space-y-4">
      <CardHeader className="px-0">
        <CardTitle className="text-base">Requirements</CardTitle>
      </CardHeader>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Gender">
          <Select
            value={form.watch('genderRequired')}
            onValueChange={(v) =>
              form.setValue('genderRequired', v as CreateJobInput['genderRequired'])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="non_binary">Non-binary</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Age min">
          <Input
            type="number"
            {...form.register('ageMin', { valueAsNumber: true })}
            placeholder="18"
          />
        </Field>
        <Field label="Age max">
          <Input
            type="number"
            {...form.register('ageMax', { valueAsNumber: true })}
            placeholder="35"
          />
        </Field>
      </div>
      <Field label="Shoot city" error={form.formState.errors.locationCity?.message}>
        <Input {...form.register('locationCity')} placeholder="e.g. London" />
      </Field>
      <Field label="Skills (comma separated)">
        <Input
          onChange={(e) =>
            form.setValue(
              'skillsRequired',
              e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
          placeholder="dance, fluent spanish, motorbike licence"
        />
      </Field>
    </div>
  )
}

function StepShoot({ form }: { form: WizardForm }) {
  const paymentType = form.watch('paymentType')
  const rateSetBy = form.watch('rateSetBy')
  return (
    <div className="space-y-4">
      <CardHeader className="px-0">
        <CardTitle className="text-base">Shoot details</CardTitle>
      </CardHeader>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Shoot date" error={form.formState.errors.shootDate?.message}>
          <Input type="datetime-local" {...form.register('shootDate')} />
        </Field>
        <Field label="Duration (hours)">
          <Input
            type="number"
            step="0.5"
            {...form.register('shootDurationHours', { valueAsNumber: true })}
          />
        </Field>
        <Field label="Payment type">
          <Select
            value={paymentType}
            onValueChange={(v) => form.setValue('paymentType', v as CreateJobInput['paymentType'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixed (flat fee)</SelectItem>
              <SelectItem value="hourly">Hourly</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Rate set by">
          <Select
            value={rateSetBy}
            onValueChange={(v) => form.setValue('rateSetBy', v as CreateJobInput['rateSetBy'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="caster">Caster (I set the rate)</SelectItem>
              <SelectItem value="open">Open to bids</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        {rateSetBy === 'caster' ? (
          <Field label={paymentType === 'hourly' ? 'Hourly rate (£)' : 'Flat fee (£)'}>
            <Input
              type="number"
              step="0.01"
              {...form.register('rateAmount', { valueAsNumber: true })}
            />
          </Field>
        ) : null}
        <Field label="Headcount">
          <Input type="number" {...form.register('headcountRequired', { valueAsNumber: true })} />
        </Field>
        <Field
          label="Application deadline"
          error={form.formState.errors.applicationDeadline?.message}
        >
          <Input type="datetime-local" {...form.register('applicationDeadline')} />
        </Field>
      </div>
    </div>
  )
}

function StepLegal({ form }: { form: WizardForm }) {
  return (
    <div className="space-y-4">
      <CardHeader className="px-0">
        <CardTitle className="text-base">Legal</CardTitle>
      </CardHeader>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register('requiresNda')} /> NDA required
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...form.register('exclusivity')} /> Exclusivity (no competitors for
        6 months)
      </label>
      <Field label="Usage rights" error={form.formState.errors.usageRights?.message}>
        <Textarea
          rows={4}
          {...form.register('usageRights')}
          placeholder="e.g. UK digital, social media, 12 months"
        />
      </Field>
    </div>
  )
}

function StepVisibility({ form }: { form: WizardForm }) {
  return (
    <div className="space-y-4">
      <CardHeader className="px-0">
        <CardTitle className="text-base">Visibility</CardTitle>
      </CardHeader>
      <Field label="Visibility">
        <Select
          value={form.watch('visibility')}
          onValueChange={(v) => form.setValue('visibility', v as CreateJobInput['visibility'])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public — anyone who matches can bid</SelectItem>
            <SelectItem value="invite_only">Invite only — only invited artists can bid</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  )
}

function StepReview({ values }: { values: CreateJobInput }) {
  return (
    <div className="space-y-3 text-sm">
      <CardHeader className="px-0">
        <CardTitle className="text-base">Review and post</CardTitle>
      </CardHeader>
      <Row label="Title" value={values.title} />
      <Row
        label="Category"
        value={`${values.category}${values.subcategory ? ` · ${values.subcategory}` : ''}`}
      />
      <Row label="City" value={values.locationCity} />
      <Row label="Shoot date" value={values.shootDate} />
      <Row label="Duration" value={`${values.shootDurationHours}h`} />
      <Row
        label="Rate"
        value={
          values.rateSetBy === 'open'
            ? 'Open to bids'
            : values.rateAmount
              ? `${formatCurrency(values.rateAmount)}${values.paymentType === 'hourly' ? '/hr' : ''}`
              : '—'
        }
      />
      <Row label="Headcount" value={String(values.headcountRequired)} />
      <Row label="Visibility" value={values.visibility} />
      <Row label="NDA" value={values.requiresNda ? 'Yes' : 'No'} />
      <Row label="Exclusivity" value={values.exclusivity ? 'Yes' : 'No'} />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border flex justify-between border-b py-2">
      <span className="text-muted-foreground capitalize">{label}</span>
      <span className="text-right capitalize">{value || '—'}</span>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  )
}
