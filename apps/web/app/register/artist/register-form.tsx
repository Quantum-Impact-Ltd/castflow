'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowRight } from 'lucide-react'
import {
  registerArtistSchema,
  type RegisterArtistInput,
} from '@castflow/validators'
import {
  AuthField,
  AuthInput,
} from '@/components/auth/auth-shell'
import { ShimmerButton } from '@/components/ui/shimmer-button'
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
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null)
    const { confirmPassword: _confirm, ...payload } = values
    void _confirm
    mutation.mutate(payload as RegisterArtistInput, {
      onSuccess: (result) => {
        // Dev bypass: account is already verified, send straight to login so
        // they can sign in without checking email. Production keeps the
        // "check your inbox" flow.
        if (result.emailVerified) {
          toast.success('Account created — log in to continue')
          router.push(`/login?email=${encodeURIComponent(payload.email)}`)
          return
        }
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
      className="space-y-5"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <AuthField
          label="First name"
          htmlFor="firstName"
          error={form.formState.errors.firstName?.message}
        >
          <AuthInput
            id="firstName"
            autoComplete="given-name"
            placeholder="Maya"
            autoFocus
            aria-invalid={!!form.formState.errors.firstName}
            {...form.register('firstName')}
          />
        </AuthField>
        <AuthField
          label="Last name"
          htmlFor="lastName"
          error={form.formState.errors.lastName?.message}
        >
          <AuthInput
            id="lastName"
            autoComplete="family-name"
            placeholder="Okafor"
            aria-invalid={!!form.formState.errors.lastName}
            {...form.register('lastName')}
          />
        </AuthField>
      </div>

      <AuthField
        label="Email"
        htmlFor="email"
        error={form.formState.errors.email?.message}
      >
        <AuthInput
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          aria-invalid={!!form.formState.errors.email}
          {...form.register('email')}
        />
      </AuthField>

      <AuthField
        label="Password"
        htmlFor="password"
        error={form.formState.errors.password?.message}
        hint={
          <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">
            8+ chars · 1 num · 1 sym
          </span>
        }
      >
        <AuthInput
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          aria-invalid={!!form.formState.errors.password}
          {...form.register('password')}
        />
      </AuthField>

      <AuthField
        label="Confirm password"
        htmlFor="confirmPassword"
        error={form.formState.errors.confirmPassword?.message}
      >
        <AuthInput
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          aria-invalid={!!form.formState.errors.confirmPassword}
          {...form.register('confirmPassword')}
        />
      </AuthField>

      {serverError ? (
        <p
          role="alert"
          className="rounded-lg border border-rose-400/30 bg-rose-400/[0.08] px-3 py-2 text-sm text-rose-200"
        >
          {serverError}
        </p>
      ) : null}

      <ShimmerButton
        type="submit"
        disabled={mutation.isPending}
        background="linear-gradient(135deg, #f9a26c 0%, #e67e3e 100%)"
        shimmerColor="#ffffff"
        className="h-12 w-full px-6 text-sm font-semibold"
      >
        {mutation.isPending ? 'Creating account…' : 'Create artist account'}
        {!mutation.isPending ? (
          <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
        ) : null}
      </ShimmerButton>

      <p className="text-center text-xs text-white/50">
        By registering you agree to our{' '}
        <Link
          href="/terms"
          className="text-white/75 underline-offset-4 hover:text-white hover:underline"
        >
          Terms
        </Link>{' '}
        and{' '}
        <Link
          href="/privacy"
          className="text-white/75 underline-offset-4 hover:text-white hover:underline"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  )
}
