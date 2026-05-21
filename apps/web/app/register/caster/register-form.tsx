'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowRight, ChevronDown } from 'lucide-react'
import {
  registerCasterSchema,
  type RegisterCasterInput,
} from '@castflow/validators'
import {
  AuthField,
  AuthInput,
} from '@/components/auth/auth-form-fields'
import { PasswordInput } from '@/components/auth/password-input'
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { useRegisterCaster } from '@/lib/hooks/use-auth'
import {
  TurnstileWidget,
  isTurnstileEnabled,
} from '@/components/auth/turnstile-widget'
import { cn } from '@/lib/utils'
import type { ApiError } from '@/lib/fetcher'

const formSchema = registerCasterSchema
  .extend({ confirmPassword: z.string().min(1) })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof formSchema>

const COMPANY_TYPES: ReadonlyArray<{
  value: RegisterCasterInput['companyType']
  label: string
}> = [
  { value: 'brand', label: 'Brand' },
  { value: 'agency', label: 'Agency' },
  { value: 'production_house', label: 'Production House' },
  { value: 'independent', label: 'Independent' },
]

export function RegisterCasterForm() {
  const router = useRouter()
  const mutation = useRegisterCaster()
  const [serverError, setServerError] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaEnabled = isTurnstileEnabled()

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
    if (captchaEnabled && !captchaToken) {
      setServerError('Please complete the captcha to continue.')
      return
    }
    const { confirmPassword: _c, ...rest } = values
    void _c
    const payload: RegisterCasterInput & { captchaToken?: string } = {
      ...(rest as RegisterCasterInput),
      ...(captchaToken ? { captchaToken } : {}),
    }
    mutation.mutate(payload, {
      onSuccess: (result) => {
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
      <AuthField
        label="Company name"
        htmlFor="companyName"
        error={form.formState.errors.companyName?.message}
      >
        <AuthInput
          id="companyName"
          autoComplete="organization"
          placeholder="Saunders & Co"
          autoFocus
          aria-invalid={!!form.formState.errors.companyName}
          {...form.register('companyName')}
        />
      </AuthField>

      <AuthField
        label="Company type"
        htmlFor="companyType"
        error={form.formState.errors.companyType?.message}
      >
        <div className="relative">
          <select
            id="companyType"
            {...form.register('companyType')}
            className={cn(
              'h-11 w-full appearance-none rounded-xl border border-white/12 bg-white/[0.04] px-4 pr-10 text-sm text-white',
              'transition-colors outline-none',
              'focus-visible:border-[#f9a26c] focus-visible:ring-2 focus-visible:ring-[#f9a26c]/30',
            )}
          >
            {COMPANY_TYPES.map((t) => (
              <option
                key={t.value}
                value={t.value}
                className="bg-[#1c2540] text-white"
              >
                {t.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50"
            aria-hidden
          />
        </div>
      </AuthField>

      <AuthField
        label="Contact name"
        htmlFor="contactName"
        error={form.formState.errors.contactName?.message}
      >
        <AuthInput
          id="contactName"
          autoComplete="name"
          placeholder="Your full name"
          aria-invalid={!!form.formState.errors.contactName}
          {...form.register('contactName')}
        />
      </AuthField>

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
          placeholder="you@studio.co.uk"
          aria-invalid={!!form.formState.errors.email}
          {...form.register('email')}
        />
      </AuthField>

      <div className="grid gap-4 sm:grid-cols-2">
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
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={!!form.formState.errors.password}
            {...form.register('password')}
          />
          <PasswordStrengthMeter
            password={form.watch('password')}
            compact
          />
        </AuthField>

        <AuthField
          label="Confirm"
          htmlFor="confirmPassword"
          error={form.formState.errors.confirmPassword?.message}
        >
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={!!form.formState.errors.confirmPassword}
            {...form.register('confirmPassword')}
          />
        </AuthField>
      </div>

      {serverError ? (
        <p
          role="alert"
          className="rounded-lg border border-rose-400/30 bg-rose-400/[0.08] px-3 py-2 text-sm text-rose-200"
        >
          {serverError}
        </p>
      ) : null}

      {captchaEnabled && (
        <TurnstileWidget
          onVerify={setCaptchaToken}
          onExpire={() => setCaptchaToken(null)}
        />
      )}

      <ShimmerButton
        type="submit"
        disabled={mutation.isPending || (captchaEnabled && !captchaToken)}
        background="linear-gradient(135deg, #f9a26c 0%, #e67e3e 100%)"
        shimmerColor="#ffffff"
        className="h-12 w-full px-6 text-sm font-semibold"
      >
        {mutation.isPending ? 'Creating account…' : 'Create caster account'}
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
