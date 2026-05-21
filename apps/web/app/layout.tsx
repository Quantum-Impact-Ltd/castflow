import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'
import { Providers } from '@/providers'
import { SessionProvider, type ResolvedSession } from '@/providers/session-provider'
import { SkipLink } from '@/components/a11y/skip-link'
import { auth } from '@/lib/auth-server'
import { SITE_URL, SITE_NAME, SITE_DEFAULT_OG } from '@/lib/site'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — UK Casting Marketplace`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    'Cast verified UK models and actors in days. Contracts, escrow payments, and reviews built in.',
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    url: SITE_URL,
    title: `${SITE_NAME} — UK Casting Marketplace`,
    description:
      'Cast verified UK models and actors in days. Contracts, escrow payments, and reviews built in.',
    images: [{ url: SITE_DEFAULT_OG, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — UK Casting Marketplace`,
    description:
      'Cast verified UK models and actors in days. Contracts, escrow payments, and reviews built in.',
    images: [SITE_DEFAULT_OG],
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Server-fetch the session once per request so the client provider can
  // skip the loading flash on first render. `.catch(() => null)` because a
  // missing/expired cookie is the common path and shouldn't crash the app.
  const initialSession = (await auth.api
    .getSession({ headers: await headers() })
    .catch(() => null)) as ResolvedSession | null

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      <body>
        <SkipLink />
        <Providers>
          <SessionProvider initialSession={initialSession}>
            {/* Skip-link target — `tabIndex={-1}` so the browser can focus
             *  it programmatically without putting it in the keyboard tab
             *  order itself. Every route renders inside this span, so the
             *  skip link works site-wide including AuthShell pages. */}
            <span id="main-content" tabIndex={-1} className="sr-only" />
            {children}
          </SessionProvider>
        </Providers>
      </body>
    </html>
  )
}
