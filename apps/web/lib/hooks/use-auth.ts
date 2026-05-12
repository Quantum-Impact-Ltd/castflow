'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  RegisterArtistInput,
  RegisterCasterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@castflow/validators'
import {
  registerArtist,
  registerCaster,
  login,
  logout,
  forgotPassword,
  resetPassword,
  resendVerification,
} from '@/lib/api/auth'

const sessionKey = ['session'] as const

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'Something went wrong'
}

export function useRegisterArtist() {
  return useMutation({
    mutationFn: (input: RegisterArtistInput) => registerArtist(input),
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useRegisterCaster() {
  return useMutation({
    mutationFn: (input: RegisterCasterInput) => registerCaster(input),
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: sessionKey })
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: sessionKey })
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) => forgotPassword(input),
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) => resetPassword(input),
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) => resendVerification(email),
    onError: (err) => toast.error(errorMessage(err)),
  })
}
