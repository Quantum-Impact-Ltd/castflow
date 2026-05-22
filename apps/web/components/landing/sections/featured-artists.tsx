import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, MapPin, Star } from 'lucide-react'
import { Reveal } from '../reveal'
import { cn } from '@/lib/utils'

// Editorial portrait photography — real images sourced from Unsplash.
// Swap with first-party shots from /public/talent/ when those land.
interface FeaturedArtist {
  id: string
  name: string
  city: string
  available: boolean
  rating: number
  src: string
}

const ARTISTS: FeaturedArtist[] = [
  {
    id: 'a-001',
    name: 'Maya',
    city: 'London',
    available: true,
    rating: 4.9,
    src: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'a-002',
    name: 'Daniel',
    city: 'Manchester',
    available: true,
    rating: 4.8,
    src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'a-003',
    name: 'Iris',
    city: 'Bristol',
    available: false,
    rating: 4.7,
    src: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'a-004',
    name: 'Theo',
    city: 'London',
    available: true,
    rating: 5.0,
    src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'a-005',
    name: 'Eleanor',
    city: 'Edinburgh',
    available: true,
    rating: 4.85,
    src: 'https://images.unsplash.com/photo-1496440737103-cd596325d314?auto=format&fit=crop&w=1000&q=80',
  },
]

export function FeaturedArtistsSection() {
  return (
    <section className="w-full bg-background py-24 lg:py-36">
      <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-primary">
                Verified talent
              </p>
              <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl lg:text-6xl">
                Approved artists,{' '}
                <span className="font-serif font-normal italic">
                  ready to bid.
                </span>
              </h2>
            </div>
            <Link
              href="/artists"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              Browse the directory
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>
        </Reveal>

        {/* Asymmetric editorial gallery — uses the same overlay treatment as /talent ArtistCard */}
        <div className="mt-16 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-12 lg:grid-rows-2 lg:gap-8">
          <Reveal className="lg:col-span-4 lg:row-span-2">
            {ARTISTS[0] ? (
              <FeaturedArtistCard
                artist={ARTISTS[0]}
                aspect="aspect-[3/4]"
                size="xl"
              />
            ) : null}
          </Reveal>

          <Reveal delay={80} className="lg:col-span-4">
            {ARTISTS[1] ? (
              <FeaturedArtistCard artist={ARTISTS[1]} aspect="aspect-[4/3]" />
            ) : null}
          </Reveal>

          <Reveal delay={160} className="lg:col-span-4">
            {ARTISTS[2] ? (
              <FeaturedArtistCard artist={ARTISTS[2]} aspect="aspect-[4/3]" />
            ) : null}
          </Reveal>

          <Reveal delay={120} className="lg:col-span-4">
            {ARTISTS[3] ? (
              <FeaturedArtistCard artist={ARTISTS[3]} aspect="aspect-[4/3]" />
            ) : null}
          </Reveal>

          <Reveal delay={200} className="col-span-2 lg:col-span-4">
            {ARTISTS[4] ? (
              <FeaturedArtistCard artist={ARTISTS[4]} aspect="aspect-[4/3]" />
            ) : null}
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function FeaturedArtistCard({
  artist,
  aspect,
  size = 'md',
}: {
  artist: FeaturedArtist
  aspect: string
  size?: 'md' | 'xl'
}) {
  const nameClass = size === 'xl' ? 'text-[40px] lg:text-[44px]' : 'text-[26px]'
  return (
    <Link href={`/artists/${artist.id}`} className="group block">
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-2xl bg-[var(--surface-50)]',
          aspect,
          size === 'xl' && 'h-full',
        )}
      >
        <Image
          src={artist.src}
          alt={artist.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className={cn(
            'object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]',
            !artist.available && 'grayscale-[40%]',
          )}
        />

        {/* Availability badge — readable at glance per audit P1 */}
        <span
          className={cn(
            'absolute right-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
            'font-mono text-[10px] font-semibold uppercase tracking-[0.18em]',
            artist.available
              ? 'bg-emerald-500/95 text-emerald-50'
              : 'bg-foreground/70 text-background',
          )}
        >
          <span className="relative flex h-1.5 w-1.5">
            {artist.available ? (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-200 opacity-80" />
            ) : null}
            <span
              className={cn(
                'relative inline-flex h-1.5 w-1.5 rounded-full',
                artist.available ? 'bg-emerald-200' : 'bg-background/80',
              )}
            />
          </span>
          {artist.available ? 'Available' : 'Booked'}
        </span>

        {/* Bottom gradient seal */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2/5 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
          aria-hidden
        />

        {/* Name + city + rating */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 p-5 text-white">
          <div>
            <p
              className={cn(
                'font-serif leading-[1.05] tracking-[-0.01em]',
                nameClass,
              )}
            >
              {artist.name}
            </p>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-white/80">
              <MapPin className="h-3 w-3" aria-hidden />
              {artist.city}
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-white">
            <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" aria-hidden />
            {artist.rating.toFixed(1)}
          </span>
        </div>
      </div>
    </Link>
  )
}
