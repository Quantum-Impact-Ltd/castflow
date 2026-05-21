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
      // Wipe any cached data from a previous session on this browser before
      // the new user's queries populate the cache. Belt-and-braces against
      // showing stale per-user data when switching accounts.
      qc.clear()
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      // Same reasoning as useLogin — drop all cached per-user data immediately
      // rather than relying on individual invalidations.
      qc.clear()
    },
    onError: (err) => toast.error(errorMessage(err)),
  })
}

export function useForgotPassword() {
  // No `onError` toast: the form intentionally renders a generic success
  // state in `onSettled` regardless of result so we don't leak whether the
  // email exists (account-enumeration defence). A red toast on top of that
  // success card contradicts the UI and tips off attackers. (Audit H3.)
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) => forgotPassword(input),
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
