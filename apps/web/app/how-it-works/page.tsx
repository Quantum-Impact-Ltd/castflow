import type { Metadata } from 'next'
import { Nav } from '@/components/landing/nav'
import { Footer } from '@/components/landing/footer'
import { HowItWorksContent } from './how-it-works-content'

export const metadata: Metadata = {
  title: 'How it works — CastFlow',
  description:
    'Post a shoot, receive bids from verified UK artists, book with one click, and pay the artist directly. Here is the four-step flow end-to-end.',
}

export default function HowItWorksPage() {
  return (
    <>
      <Nav />
      <main className="bg-background">
        <HowItWorksContent />
      </main>
      <Footer />
    </>
  )
}
