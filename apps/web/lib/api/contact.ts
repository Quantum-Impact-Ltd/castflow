import type { ContactMessageInput } from '@castflow/validators'
import { fetcher } from '@/lib/fetcher'

interface FetcherInit {
  signal?: AbortSignal
}

export function sendContactMessage(
  input: ContactMessageInput,
  init?: FetcherInit,
): Promise<{ received: boolean }> {
  return fetcher<{ received: boolean }>('/contact', {
    method: 'POST',
    body: input,
    ...init,
  })
}
