'use client'

import { useEffect } from 'react'

/**
 * When `when` is true, intercept the browser's `beforeunload` event so the
 * user gets the native "Leave site? Changes you made may not be saved"
 * confirm before navigating away — closing the tab, hitting back, typing a
 * new URL, or following an in-app link that triggers a full navigation.
 *
 * Limitations:
 *   - The Next.js client router's soft navigations (Link with prefetch /
 *     router.push) do NOT fire `beforeunload`. For those, callers need to
 *     hook the link click itself. The OnboardingShell's "Exit" link is a
 *     plain <Link href="/">, which Next.js may handle as a soft nav — but
 *     it points to the root which is outside the (artist) layout group, so
 *     it triggers a real document navigation in practice and beforeunload
 *     fires. Tab close / external nav always work.
 *
 * (Audit M19.)
 */
export function useBeforeUnloadWarning(when: boolean): void {
  useEffect(() => {
    if (!when) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // Modern browsers ignore the message string but still need
      // `returnValue` set to a truthy value to trigger the prompt.
      e.returnValue = ''
      return ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [when])
}
