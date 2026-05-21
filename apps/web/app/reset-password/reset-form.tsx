'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowRight } from 'lucide-react'
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@castflow/validators'
import { AuthField, AuthInput } from '@/components/auth/auth-form-fields'
import { PasswordInput } from '@/components/auth/password-input'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { useResetPassword } from '@/lib/hooks/use-auth'

const formSchema = resetPasswordSchema
  .extend({ confirmPassword: z.string().min(1) })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof formSchema>

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const mutation = useResetPassword()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { token, password: '', confirmPassword: '' },
  })

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null)
    const payload: ResetPasswordInput = {
      token: values.token,
      password: values.password,
    }
    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Password updated. You can now log in.')
        router.push('/login')
      },
      onError: (err) => {
        const e = err as Error & { code?: string; status?: number }
        if (e.code === 'INVALID_TOKEN' || e.status === 400) {
          setServerError('This reset link has expired or already been used.')
        } else {
          setServerError(e.message || 'Could not reset your password.')
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
      <input type="hidden" {...form.register('token')} />

      <AuthField
        label="New password"
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
      </AuthField>

      <AuthField
        label="Confirm new password"
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
        {mutation.isPending ? 'Updating…' : 'Set new password'}
        {!mutation.isPending ? (
          <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
        ) : null}
      </ShimmerButton>
    </form>
  )
}
