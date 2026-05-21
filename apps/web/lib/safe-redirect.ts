/**
 * Returns `raw` only if it's a safe same-origin path to redirect to.
 *
 * Rejects any value that the browser would normalise to a cross-origin
 * URL — protocol-relative (`//evil.com`), backslash-prefixed
 * (`/\evil.com` — backslashes are normalised to slashes by most
 * browsers), URL-encoded backslash bypasses (`/%5Cevil.com`,
 * `%2f/evil.com`), absolute URLs, and anything that doesn't start with a
 * single `/`.
 *
 * Returns `null` when the input is unsafe so callers can fall back to a
 * default destination.
 */
export function safeInternalRedirect(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null

  // Reject any control-character payload outright — browsers strip
  // tab/newline/CR from URLs before navigation, so an attacker could use
  // them to dodge a prefix check (e.g. `/\tevil.com`).
  if (/[\x00-\x1f\x7f]/.test(raw)) return null

  const trimmed = raw.trim()
  if (trimmed.length === 0) return null
  if (trimmed.length > 2048) return null

  // Must start with a single `/` (path-absolute, same-origin).
  if (!trimmed.startsWith('/')) return null

  // Look at the first two characters AFTER URL-decoding so `%2f`/`%5c`
  // bypasses (`/%2fevil.com`, `/%5cevil.com`) are caught too.
  let decoded: string
  try {
    decoded = decodeURIComponent(trimmed.slice(0, 8))
  } catch {
    return null
  }
  if (decoded.length >= 2) {
    const second = decoded[1]
    if (second === '/' || second === '\\') return null
  }

  return trimmed
}
