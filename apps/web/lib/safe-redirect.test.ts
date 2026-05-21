import { describe, it, expect } from 'vitest'
import { safeInternalRedirect } from './safe-redirect'

describe('safeInternalRedirect', () => {
  it('accepts a simple same-origin path', () => {
    expect(safeInternalRedirect('/artist/dashboard')).toBe('/artist/dashboard')
  })

  it('accepts root path', () => {
    expect(safeInternalRedirect('/')).toBe('/')
  })

  it('accepts a path with query string and hash', () => {
    expect(safeInternalRedirect('/jobs?q=foo&page=2#top')).toBe(
      '/jobs?q=foo&page=2#top',
    )
  })

  it('rejects null / undefined / empty', () => {
    expect(safeInternalRedirect(null)).toBeNull()
    expect(safeInternalRedirect(undefined)).toBeNull()
    expect(safeInternalRedirect('')).toBeNull()
    expect(safeInternalRedirect('   ')).toBeNull()
  })

  it('rejects non-prefix paths', () => {
    expect(safeInternalRedirect('artist/dashboard')).toBeNull()
    expect(safeInternalRedirect('http://evil.com')).toBeNull()
    expect(safeInternalRedirect('https://evil.com')).toBeNull()
  })

  it('rejects protocol-relative URLs', () => {
    expect(safeInternalRedirect('//evil.com')).toBeNull()
    expect(safeInternalRedirect('///evil.com')).toBeNull()
  })

  it('rejects backslash-prefixed paths (browser normalises \\ → /)', () => {
    expect(safeInternalRedirect('/\\evil.com')).toBeNull()
    expect(safeInternalRedirect('/\\/evil.com')).toBeNull()
  })

  it('rejects URL-encoded backslash bypasses', () => {
    expect(safeInternalRedirect('/%5Cevil.com')).toBeNull()
    expect(safeInternalRedirect('/%5cevil.com')).toBeNull()
    expect(safeInternalRedirect('/%2Fevil.com')).toBeNull()
  })

  it('rejects control-character payloads (tab/newline/null)', () => {
    expect(safeInternalRedirect('/\tevil.com')).toBeNull()
    expect(safeInternalRedirect('/\nevil.com')).toBeNull()
    expect(safeInternalRedirect('/\x00evil.com')).toBeNull()
  })

  it('rejects oversized payloads', () => {
    expect(safeInternalRedirect('/' + 'a'.repeat(2048))).toBeNull()
  })

  it('trims surrounding whitespace before evaluating', () => {
    expect(safeInternalRedirect('  /artist/dashboard  ')).toBe('/artist/dashboard')
    // …but a leading-space-then-//evil pattern still resolves to //evil after trim → reject
    expect(safeInternalRedirect('  //evil.com')).toBeNull()
  })
})
