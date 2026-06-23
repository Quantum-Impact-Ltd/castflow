import type { Metadata } from 'next'
import { Nav } from '@/components/landing/nav'
import { Footer } from '@/components/landing/footer'
import { SITE_URL } from '@/lib/site'
import { CasterProfileView } from './caster-profile-view'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const title = 'Company profile'
  const description =
    'A verified casting company on CastFlow. See their open shoots and what artists say about working with them.'
  const canonical = `${SITE_URL}/casters/${id}`
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: 'profile', url: canonical, title, description },
    twitter: { card: 'summary', title, description },
  }
}

export default async function CasterPublicProfilePage({ params }: PageProps) {
  const { id } = await params
  return (
    <>
      <Nav />
      <main className="min-h-[calc(100vh-4rem)] bg-background">
        <CasterProfileView id={id} />
      </main>
      <Footer />
    </>
  )
}
