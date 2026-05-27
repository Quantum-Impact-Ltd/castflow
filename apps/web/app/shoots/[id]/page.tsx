import type { Metadata } from 'next'
import { Nav } from '@/components/landing/nav'
import { Footer } from '@/components/landing/footer'
import { getMockShoot } from '@/lib/mock/shoots'
import { ShootDetailView } from './shoot-detail-view'

interface PageProps {
  params: Promise<{ id: string }>
}

// Live job detail is fetched client-side (no public-API access at build time),
// so metadata is generic for real jobs and enriched only when the id matches a
// mock shoot — mirrors the public artist profile page's approach.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const shoot = getMockShoot(id)
  if (shoot) {
    return { title: `${shoot.title} — CastFlow`, description: shoot.description }
  }
  return {
    title: 'Live shoot — CastFlow',
    description: 'A live casting brief on CastFlow. Sign in to bid.',
  }
}

export default async function ShootDetailPage({ params }: PageProps) {
  const { id } = await params

  return (
    <>
      <Nav />
      <main className="min-h-[calc(100vh-4rem)] bg-background">
        <ShootDetailView id={id} />
      </main>
      <Footer />
    </>
  )
}
