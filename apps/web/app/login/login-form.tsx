'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@castflow/validators'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLogin } from '@/lib/hooks/use-auth'
import { getSession } from '@/lib/api/auth'
import { postLoginPath } from '@/lib/auth-redirect'
import { authClient } from '@/lib/auth-client'

export function LoginForm() {
  const router = useRouter()
  const mutation = useLogin()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = form.handleSubmit((values) => {
    setServerError(null)
    mutation.mutate(values, {
      onSuccess: () => {
        void getSession().then((session) => {
          if (session?.user) {
            router.push(postLoginPath(session.user))
          } else {
            router.push('/')
          }
        })
      },
      onError: (err) => {
        const e = err as Error & { code?: string; status?: number }
        if (e.code === 'EMAIL_NOT_VERIFIED' || e.status === 403) {
          setServerError('Please verify your email before logging in.')
        } else if (e.status === 401) {
          setServerError('Incorrect email or password.')
        } else {
          setServerError(e.message || 'Could not log in.')
        }
      },
    })
  })

  const handleGoogle = () => {
    setServerError(null)
    authClient.signIn.social({ provider: 'google', callbackURL: '/' }).catch((err: unknown) => {
      setServerError((err as Error).message || 'Google sign-in failed.')
    })
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          void onSubmit(e)
        }}
        className="space-y-4"
        noValidate
      >
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-muted-foreground text-xs hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p className="text-destructive text-xs">{form.formState.errors.password.message}</p>
          )}
        </div>

        {serverError && (
          <p role="alert" className="text-destructive text-sm">
            {serverError}
          </p>
        )}

        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <div className="text-muted-foreground relative text-center text-xs">
        <span className="bg-background relative z-10 px-2">or</span>
        <span className="bg-border absolute inset-x-0 top-1/2 z-0 block h-px" />
      </div>

      <Button type="button" variant="outline" onClick={handleGoogle} className="w-full">
        Continue with Google
      </Button>
    </div>
  )
}
