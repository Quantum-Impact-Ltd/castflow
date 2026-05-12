import { describe, expect, it } from 'vitest'
import { cn, formatCurrency, formatDate } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('dedupes tailwind classes — later wins', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('handles falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b')
  })
})

describe('formatCurrency', () => {
  it('formats GBP with two decimals', () => {
    expect(formatCurrency(500)).toMatch(/£500\.00/)
  })

  it('formats fractional amounts', () => {
    expect(formatCurrency(85.5)).toMatch(/£85\.50/)
  })
})

describe('formatDate', () => {
  it('formats ISO date as en-GB long form', () => {
    expect(formatDate('2026-05-12')).toBe('12 May 2026')
  })
})
