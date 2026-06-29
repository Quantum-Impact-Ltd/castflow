'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { ChevronDown } from 'lucide-react'
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
import { useRegisterCaster } from '@/lib/hooks/use-auth'
import { TurnstileWidget } from '@/components/auth/turnstile-widget'
import {
  useRegisterFlow,
  withConfirmPassword,
} from '@/components/auth/register-form-kit'
import {
  RegisterServerError,
  RegisterSubmitButton,
  RegisterTermsFooter,
} from '@/components/auth/register-form-ui'
import { cn } from '@/lib/utils'

const formSchema = withConfirmPassword(registerCasterSchema)

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
  const mutation = useRegisterCaster()

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

  const { serverError, captchaEnabled, captchaToken, setCaptchaToken, submit } =
    useRegisterFlow({
      form,
      mutation,
      role: 'caster',
      toPayload: ({ confirmPassword: _c, ...rest }, captchaToken) => {
        void _c
        return {
          ...(rest as RegisterCasterInput),
          ...(captchaToken ? { captchaToken } : {}),
        }
      },
    })

  return (
    <form
      onSubmit={(e) => {
        void submit(e)
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
              'focus-visible:border-[var(--cta-400)] focus-visible:ring-2 focus-visible:ring-[var(--cta-400)]/30',
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

      {/* Password + Confirm stack until md — at sm (640px) the two fields plus
          inline error text get cramped, so wait until 768px to go 2-col. */}
      <div className="grid gap-4 md:grid-cols-2">
        <AuthField
          label="Password"
          htmlFor="password"
          error={form.formState.errors.password?.message}
          hint={
            <span className="text-[10px] uppercase tracking-[0.16em] text-white/70">
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
          label="Confirm password"
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

      <RegisterServerError message={serverError} />

      {captchaEnabled && (
        <TurnstileWidget
          onVerify={setCaptchaToken}
          onExpire={() => setCaptchaToken(null)}
        />
      )}

      <RegisterSubmitButton
        label="Create caster account"
        pending={mutation.isPending}
        disabled={mutation.isPending || (captchaEnabled && !captchaToken)}
      />

      <RegisterTermsFooter />
    </form>
  )
}
