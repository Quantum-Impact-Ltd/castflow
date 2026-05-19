import type { Metadata } from 'next'
import { Nav } from '@/components/landing/nav'
import { Footer } from '@/components/landing/footer'
import { ShootsContent } from './shoots-content'

export const metadata: Metadata = {
  title: 'Live shoots — CastFlow',
  description:
    'Browse live casting briefs from verified UK casters and brands. Filter by city, type, and rate. Sign in to bid.',
}

export default function ShootsPage() {
  return (
    <>
      <Nav />
      <main className="bg-background">
        <ShootsContent />
      </main>
      <Footer />
    </>
  )
}
