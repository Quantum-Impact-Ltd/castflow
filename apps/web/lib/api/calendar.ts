import { fetcher } from '@/lib/fetcher'
import type { Init } from './types'

export function getCalendarFeedUrl(init?: Init) {
  return fetcher<{ url: string }>('/calendar/me', init)
}

export function regenerateCalendarFeed() {
  return fetcher<{ url: string }>('/calendar/me/regenerate', { method: 'POST' })
}
