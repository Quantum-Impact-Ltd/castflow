'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { registerArtistSchema, type RegisterArtistInput } from '@castflow/validators'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRegisterArtist } from '@/lib/hooks/use-auth'
import type { ApiError } from '@/lib/fetcher'

const formSchema = registerArtistSchema
  .extend({ confirmPassword: z.string().min(1) })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof formSchema>

export function RegisterArtistForm() {
  const router = useRouter()
  const mutation = useRegisterArtist()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      artistType: 'model',
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null)
    const { confirmPassword: _confirm, ...payload } = values
    void _confirm
    mutation.mutate(payload as RegisterArtistInput, {
      onSuccess: () => {
        toast.success('Account created — check your email to verify')
        router.push(`/verify-email?email=${encodeURIComponent(payload.email)}`)
      },
      onError: (err) => {
        const apiErr = err as ApiError
        if (apiErr.fields) {
          for (const [field, msgs] of Object.entries(apiErr.fields)) {
            form.setError(field as keyof FormValues, {
              type: 'server',
              message: msgs[0],
            })
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
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">I&apos;m a…</legend>
        <div className="flex gap-3">
          {(['model', 'actor'] as const).map((type) => (
            <label
              key={type}
              className="hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-accent flex flex-1 cursor-pointer items-center justify-center rounded-md border p-3 text-sm capitalize"
            >
              <input
                type="radio"
                value={type}
                {...form.register('artistType')}
                className="sr-only"
              />
              {type}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" autoComplete="given-name" {...form.register('firstName')} />
          {form.formState.errors.firstName && (
            <p className="text-destructive text-xs">{form.formState.errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" autoComplete="family-name" {...form.register('lastName')} />
          {form.formState.errors.lastName && (
            <p className="text-destructive text-xs">{form.formState.errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          {...form.register('email')}
        />
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
        {mutation.isPending ? 'Creating account…' : 'Create artist account'}
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
