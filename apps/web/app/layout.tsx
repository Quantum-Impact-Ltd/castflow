import type { Metadata } from 'next'
import { Inter, EB_Garamond, Public_Sans } from 'next/font/google'
import { Providers } from '@/providers'
import './globals.css'
import { cn } from "@/lib/utils";

const publicSansHeading = Public_Sans({subsets:['latin'],variable:'--font-heading'});

const ebGaramond = EB_Garamond({subsets:['latin'],variable:'--font-serif'});

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CastFlow — UK Casting Marketplace',
  description: 'Find and book professional models and actors for your shoot.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-serif", ebGaramond.variable, publicSansHeading.variable)}>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
