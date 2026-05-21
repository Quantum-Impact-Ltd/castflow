import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'
import { Providers } from '@/providers'
import { SessionProvider, type ResolvedSession } from '@/providers/session-provider'
import { auth } from '@/lib/auth-server'
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
  title: 'CastFlow — UK Casting Marketplace',
  description:
    'Cast verified UK models and actors in days. Contracts, escrow payments, and reviews built in.',
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
        <Providers>
          <SessionProvider initialSession={initialSession}>{children}</SessionProvider>
        </Providers>
      </body>
    </html>
  )
}
