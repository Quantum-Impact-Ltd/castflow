import type { Metadata } from 'next'
import { Nav } from '@/components/landing/nav'
import { Footer } from '@/components/landing/footer'
import { TalentContent } from './talent-content'

export const metadata: Metadata = {
  title: 'Browse talent — CastFlow',
  description:
    'Browse verified UK models and actors on CastFlow. Filter by type, city, and experience. Sign in as a caster to shortlist.',
}

export default function TalentPage() {
  return (
    <>
      <Nav />
      <main className="bg-background">
        <TalentContent />
      </main>
      <Footer />
    </>
  )
}
