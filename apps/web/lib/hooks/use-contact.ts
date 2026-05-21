'use client'

import { useMutation } from '@tanstack/react-query'
import type { ContactMessageInput } from '@castflow/validators'
import { sendContactMessage } from '@/lib/api/contact'

export function useSendContactMessage() {
  return useMutation({
    mutationFn: (input: ContactMessageInput) => sendContactMessage(input),
  })
}
