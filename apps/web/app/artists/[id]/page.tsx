import type { Metadata } from 'next'
import { Nav } from '@/components/landing/nav'
import { Footer } from '@/components/landing/footer'
import { SITE_URL } from '@/lib/site'
import { ArtistProfileView } from './artist-profile-view'

interface PageProps {
  params: Promise<{ id: string }>
}

// Per-artist metadata — currently generic-but-distinct because there is no
// public-by-id artist endpoint (talent/:id requires caster auth). Once a
// public endpoint exists, fetch the artist here and surface their first
// name, city, and primary portfolio image as the OG image.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const title = 'Artist profile'
  const description =
    'Verified UK casting talent on CastFlow. Browse the portfolio, then sign in as a caster to shortlist or message.'
  const canonical = `${SITE_URL}/artists/${id}`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'profile',
      url: canonical,
      title,
      description,
    },
    twitter: { card: 'summary', title, description },
  }
}

export default async function ArtistPublicProfilePage({ params }: PageProps) {
  const { id } = await params
  return (
    <>
      <Nav />
      <main className="min-h-[calc(100vh-4rem)] bg-background">
        <ArtistProfileView id={id} />
      </main>
      <Footer />
    </>
  )
}
