'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { z } from 'zod'
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'
import type { UseMutationResult } from '@tanstack/react-query'
import { isTurnstileEnabled } from '@/components/auth/turnstile-widget'
import type { ApiError } from '@/lib/fetcher'

/**
 * Add a `confirmPassword` field to a register schema and assert it matches
 * `password`. Both register forms wrap their `@castflow/validators` schema
 * with this. (Dedupe #1.)
 */
export function withConfirmPassword<
  Shape extends z.ZodRawShape & { password: z.ZodType<string> },
>(schema: z.ZodObject<Shape>) {
  return schema
    .extend({ confirmPassword: z.string().min(1) })
    .refine((v) => v.password === v.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    })
}

interface UseRegisterFlowArgs<
  TForm extends FieldValues & { email: string },
  TPayload,
  TData extends { emailVerified: boolean },
> {
  form: UseFormReturn<TForm>
  mutation: UseMutationResult<TData, Error, TPayload>
  /** Map validated form values + captcha token to the API payload. */
  toPayload: (values: TForm, captchaToken: string | null) => TPayload
  /** Carried into the verify-email step so "Wrong email?" returns to the
   *  right role form instead of the role chooser. */
  role: 'artist' | 'caster'
}

/**
 * Shared submit pipeline for the artist/caster register forms: captcha gate,
 * server-error state, success routing (dev auto-verify → login, otherwise
 * → verify-email), and API field-error mapping back onto the form.
 */
export function useRegisterFlow<
  TForm extends FieldValues & { email: string },
  TPayload,
  TData extends { emailVerified: boolean },
>({
  form,
  mutation,
  toPayload,
  role,
}: UseRegisterFlowArgs<TForm, TPayload, TData>) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaEnabled = isTurnstileEnabled()

  const submit = form.handleSubmit((values) => {
    setServerError(null)
    if (captchaEnabled && !captchaToken) {
      setServerError('Please complete the captcha to continue.')
      return
    }
    mutation.mutate(toPayload(values, captchaToken), {
      onSuccess: (result) => {
        const email = values.email
        // Dev bypass: account is already verified, send straight to login.
        // Production keeps the "check your inbox" flow.
        if (result.emailVerified) {
          toast.success('Account created — log in to continue')
          router.push(`/login?email=${encodeURIComponent(email)}`)
          return
        }
        toast.success('Account created — check your email to verify')
        router.push(
          `/verify-email?email=${encodeURIComponent(email)}&role=${role}`,
        )
      },
      onError: (err) => {
        const apiErr = err as ApiError
        if (apiErr.fields) {
          for (const [field, msgs] of Object.entries(apiErr.fields)) {
            form.setError(field as Path<TForm>, {
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

  return { serverError, captchaEnabled, captchaToken, setCaptchaToken, submit }
}
