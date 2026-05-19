import { Nav } from '@/components/landing/nav'
import { Footer } from '@/components/landing/footer'
import { ArtistProfileView } from './artist-profile-view'

interface PageProps {
  params: Promise<{ id: string }>
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
