'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { resetPasswordSchema, type ResetPasswordInput } from '@castflow/validators'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    const payload: ResetPasswordInput = { token: values.token, password: values.password }
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
      className="space-y-4"
      noValidate
    >
      <input type="hidden" {...form.register('token')} />

      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
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
        <Label htmlFor="confirmPassword">Confirm new password</Label>
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
        {mutation.isPending ? 'Updating…' : 'Set new password'}
      </Button>
    </form>
  )
}
