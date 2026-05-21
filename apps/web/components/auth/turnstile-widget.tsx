'use client'

import Script from 'next/script'
import { useEffect, useRef } from 'react'

// Cloudflare Turnstile bindings. Only the bits we actually call are typed.
interface TurnstileRenderOptions {
  sitekey: string
  callback: (token: string) => void
  'error-callback'?: () => void
  'expired-callback'?: () => void
  theme?: 'light' | 'dark' | 'auto'
}

interface TurnstileGlobal {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileGlobal
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void
  onExpire?: () => void
  theme?: 'light' | 'dark' | 'auto'
}

/**
 * Wrapper around Cloudflare Turnstile. Renders nothing when
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't configured (dev convenience —
 * backend captcha middleware is no-op'd by the same env-flag pattern).
 *
 * (Audit H5.)
 */
export function TurnstileWidget({
  onVerify,
  onExpire,
  theme = 'dark',
}: TurnstileWidgetProps) {
  const siteKey = process.env['NEXT_PUBLIC_TURNSTILE_SITE_KEY']
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!siteKey) return
    if (!window.turnstile || !containerRef.current) return
    if (widgetIdRef.current) return
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme,
      callback: onVerify,
      'expired-callback': onExpire,
    })
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [siteKey, theme, onVerify, onExpire])

  if (!siteKey) return null

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div ref={containerRef} className="flex justify-center" />
    </>
  )
}

/** True when the site key is configured — useful for gating form submit. */
export function isTurnstileEnabled(): boolean {
  return Boolean(process.env['NEXT_PUBLIC_TURNSTILE_SITE_KEY'])
}
