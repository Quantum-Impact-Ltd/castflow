import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Nav } from '@/components/landing/nav'
import { Footer } from '@/components/landing/footer'
import { getMockShoot } from '@/lib/mock/shoots'
import { ShootDetailView } from './shoot-detail-view'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const shoot = getMockShoot(id)
  if (!shoot) return { title: 'Shoot not found — CastFlow' }
  return {
    title: `${shoot.title} — CastFlow`,
    description: shoot.description,
  }
}

export default async function ShootDetailPage({ params }: PageProps) {
  const { id } = await params
  const shoot = getMockShoot(id)
  if (!shoot) notFound()

  return (
    <>
      <Nav />
      <main className="min-h-[calc(100vh-4rem)] bg-background">
        <ShootDetailView shoot={shoot} />
      </main>
      <Footer />
    </>
  )
}
