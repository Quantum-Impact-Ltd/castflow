import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Reveal } from '../reveal'
import { PortraitBlock } from '../portrait-block'
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern'
import { GlareHover } from '@/components/ui/glare-hover'
import { cn } from '@/lib/utils'

const PORTRAIT_ROW = [
  {
    name: 'Aisha Yates',
    meta: 'Model · Leeds',
    src: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Jonah Carrick',
    meta: 'Actor · London',
    src: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Priya Sharma',
    meta: 'Model · London',
    src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Marlowe Quinn',
    meta: 'Actor · Bristol',
    src: 'https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=900&q=80',
  },
]

export function ArtistBandSection() {
  return (
    <section className="relative w-full overflow-hidden bg-[var(--ink-900)] py-28 text-white lg:py-44">
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.06}
        duration={6}
        repeatDelay={1.2}
        className={cn(
          'pointer-events-none [mask-image:radial-gradient(1000px_circle_at_top_right,white,transparent)]',
          'inset-x-0 inset-y-[-30%] h-[160%] -skew-y-12 fill-[var(--brand-300)]/40 stroke-[var(--brand-300)]/40',
        )}
      />
      <div className="relative mx-auto w-full max-w-[90rem] px-6 lg:px-8">
        <Reveal>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-8">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-[var(--brand-300)]">
                For models and actors
              </p>
              <h2 className="mt-6 text-balance text-5xl font-medium leading-[0.98] tracking-[-0.03em] sm:text-6xl lg:text-[7rem]">
                Keep{' '}
                <span className="font-serif font-normal italic">100%</span> of
                what you earn.
              </h2>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/75 sm:text-xl">
                No agency cut. No platform cut. Just paid work, on time, with
                contracts that protect you and reviews that build a reputation
                you own.
              </p>
              <Link
                href="/artists"
                className="group mt-12 inline-flex items-center gap-2 rounded-full bg-background px-7 py-3.5 text-base font-medium text-[var(--ink-900)] transition-all hover:bg-background/90"
              >
                Join CastFlow as an artist
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
          </div>
        </Reveal>

        {/* Portrait row — real photography lands here when /public/talent/ is populated */}
        <Reveal delay={120}>
          <div className="mt-20 grid grid-cols-2 gap-4 sm:gap-5 lg:mt-28 lg:grid-cols-4">
            {PORTRAIT_ROW.map((artist) => (
              <GlareHover
                key={artist.name}
                color="#85bcda"
                opacity={0.25}
                className="aspect-[4/5] w-full rounded-xl"
              >
                <PortraitBlock
                  name={artist.name}
                  meta={artist.meta}
                  src={artist.src}
                  variant="dark"
                  size="md"
                  className="aspect-[4/5] w-full"
                />
              </GlareHover>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
