'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import {
  registerArtistSchema,
  type RegisterArtistInput,
} from '@castflow/validators'
import {
  AuthField,
  AuthInput,
} from '@/components/auth/auth-form-fields'
import { PasswordInput } from '@/components/auth/password-input'
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter'
import { useRegisterArtist } from '@/lib/hooks/use-auth'
import { maxDobForAge } from '@/lib/dob'
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

const formSchema = withConfirmPassword(registerArtistSchema)

type FormValues = z.infer<typeof formSchema>

export function RegisterArtistForm() {
  const mutation = useRegisterArtist()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      dob: '',
    },
  })

  // Latest selectable DOB so the picker reflects the 18+ rule; the zod schema
  // is still the source of truth.
  const dobMax = maxDobForAge(18)

  const { serverError, captchaEnabled, captchaToken, setCaptchaToken, submit } =
    useRegisterFlow({
      form,
      mutation,
      role: 'artist',
      toPayload: ({ confirmPassword: _c, ...rest }, captchaToken) => {
        void _c
        return {
          ...(rest as RegisterArtistInput),
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
        label="Date of birth"
        htmlFor="dob"
        error={form.formState.errors.dob?.message}
        hint={
          <span className="text-[10px] uppercase tracking-[0.16em] text-white/70">
            18+ only
          </span>
        }
      >
        <AuthInput
          id="dob"
          type="date"
          autoComplete="bday"
          max={dobMax}
          aria-invalid={!!form.formState.errors.dob}
          {...form.register('dob')}
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
        <PasswordStrengthMeter password={form.watch('password')} />
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

      <RegisterServerError message={serverError} />

      {captchaEnabled && (
        <TurnstileWidget
          onVerify={setCaptchaToken}
          onExpire={() => setCaptchaToken(null)}
        />
      )}

      <RegisterSubmitButton
        label="Create artist account"
        pending={mutation.isPending}
        disabled={mutation.isPending || (captchaEnabled && !captchaToken)}
      />

      <RegisterTermsFooter />
    </form>
  )
}
