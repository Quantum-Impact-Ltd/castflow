'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { registerCasterSchema, type RegisterCasterInput } from '@castflow/validators'
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
import { useRegisterCaster } from '@/lib/hooks/use-auth'
import type { ApiError } from '@/lib/fetcher'

const formSchema = registerCasterSchema
  .extend({ confirmPassword: z.string().min(1) })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof formSchema>

const COMPANY_TYPES: ReadonlyArray<{ value: RegisterCasterInput['companyType']; label: string }> = [
  { value: 'brand', label: 'Brand' },
  { value: 'agency', label: 'Agency' },
  { value: 'production_house', label: 'Production House' },
  { value: 'independent', label: 'Independent' },
]

export function RegisterCasterForm() {
  const router = useRouter()
  const mutation = useRegisterCaster()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      companyType: 'brand',
      contactName: '',
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null)
    const { confirmPassword: _c, ...payload } = values
    void _c
    mutation.mutate(payload as RegisterCasterInput, {
      onSuccess: () => {
        toast.success('Account created — check your email to verify')
        router.push(`/verify-email?email=${encodeURIComponent(payload.email)}`)
      },
      onError: (err) => {
        const apiErr = err as ApiError
        if (apiErr.fields) {
          for (const [field, msgs] of Object.entries(apiErr.fields)) {
            form.setError(field as keyof FormValues, { type: 'server', message: msgs[0] })
          }
        } else {
          setServerError(apiErr.message)
        }
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
        <Label htmlFor="companyName">Company name</Label>
        <Input id="companyName" autoComplete="organization" {...form.register('companyName')} />
        {form.formState.errors.companyName && (
          <p className="text-destructive text-xs">{form.formState.errors.companyName.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="companyType">Company type</Label>
        <Select
          value={form.watch('companyType')}
          onValueChange={(v) =>
            form.setValue('companyType', v as RegisterCasterInput['companyType'])
          }
        >
          <SelectTrigger id="companyType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMPANY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.companyType && (
          <p className="text-destructive text-xs">{form.formState.errors.companyType.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contactName">Contact name</Label>
        <Input id="contactName" autoComplete="name" {...form.register('contactName')} />
        {form.formState.errors.contactName && (
          <p className="text-destructive text-xs">{form.formState.errors.contactName.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
        {form.formState.errors.email && (
          <p className="text-destructive text-xs">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...form.register('password')}
        />
        {form.formState.errors.password && (
          <p className="text-destructive text-xs">{form.formState.errors.password.message}</p>
        )}
        <p className="text-muted-foreground text-xs">
          At least 8 chars, one number, one special character.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...form.register('confirmPassword')}
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-destructive text-xs">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      {serverError && (
        <p role="alert" className="text-destructive text-sm">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? 'Creating account…' : 'Create caster account'}
      </Button>

      <p className="text-muted-foreground text-center text-xs">
        By registering you agree to our{' '}
        <Link href="/terms" className="underline-offset-4 hover:underline">
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline-offset-4 hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  )
}
