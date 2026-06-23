import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API payloads carry Prisma Decimal as string and may omit nullable fields.
// Coerce defensively so an unexpected null/undefined renders as £0.00 instead of "NaN".
export function formatCurrency(amount: number | string | null | undefined): string {
  const n = typeof amount === 'string' ? Number(amount) : (amount ?? 0)
  const safe = Number.isFinite(n) ? n : 0
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(safe)
}

// ratingAvg is a Prisma Decimal → arrives as a JSON string, so `.toFixed()`
// would throw "is not a function". Coerce defensively before formatting.
export function formatRating(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : (value ?? 0)
  return (Number.isFinite(n) ? n : 0).toFixed(1)
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}
