'use client'

import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Globe, Phone } from 'lucide-react'
import type { CasterProfile } from '@castflow/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateMyCaster } from '@/lib/hooks/use-caster'
import { StepNav } from '../step-nav'

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
  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: profile.phone ?? '',
      website: profile.website ?? '',
    },
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
          Signed in as <span className="text-[#f9a26c]">{profile.companyName}</span>
        </p>
        <p className="text-xs text-white/55">
          {profile.contactName} ·{' '}
          {profile.companyType
            .replace('_', ' ')
            .replace(/^\w/, (c) => c.toUpperCase())}
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
