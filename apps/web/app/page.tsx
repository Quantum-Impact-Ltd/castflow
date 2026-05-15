import { Nav } from '@/components/landing/nav'
import { Footer } from '@/components/landing/footer'
import { Hero } from '@/components/landing/sections/hero'
import { TrustMarqueeSection } from '@/components/landing/sections/trust-marquee'
import { NumbersStripSection } from '@/components/landing/sections/numbers-strip'
import { LiveShootsSection } from '@/components/landing/sections/live-shoots'
import { FeaturedArtistsSection } from '@/components/landing/sections/featured-artists'
import { FlowSection } from '@/components/landing/sections/flow'
import { WhyCastflowSection } from '@/components/landing/sections/why-castflow'
import { PricingPreviewSection } from '@/components/landing/sections/pricing-preview'
import { ArtistBandSection } from '@/components/landing/sections/artist-band'
import { FinalCtaSection } from '@/components/landing/sections/final-cta'

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <TrustMarqueeSection />
        <NumbersStripSection />
        <LiveShootsSection />
        <FeaturedArtistsSection />
        <FlowSection />
        <WhyCastflowSection />
        <PricingPreviewSection />
        <ArtistBandSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </>
  )
}
