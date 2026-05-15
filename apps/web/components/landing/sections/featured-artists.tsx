import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Reveal } from '../reveal'
import { PortraitBlock } from '../portrait-block'

// Names + meta swap automatically when real photos land in /public/talent/.
const ARTISTS = [
  { name: 'Maya Okafor', meta: 'Model · London', src: undefined },
  { name: 'Daniel Reyes', meta: 'Actor · Manchester', src: undefined },
  { name: 'Iris Calloway', meta: 'Model · Bristol', src: undefined },
  { name: 'Theo Mensah', meta: 'Actor · London', src: undefined },
  { name: 'Eleanor Park', meta: 'Model · Edinburgh', src: undefined },
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

        {/* Asymmetric editorial gallery — varied aspect ratios, not a flat grid. */}
        <div className="mt-16 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-12 lg:grid-rows-2 lg:gap-8">
          <Reveal className="lg:col-span-4 lg:row-span-2">
            {ARTISTS[0] ? (
              <PortraitBlock
                name={ARTISTS[0].name}
                meta={ARTISTS[0].meta}
                src={ARTISTS[0].src}
                size="xl"
                className="aspect-[3/4] h-full w-full"
              />
            ) : null}
          </Reveal>

          <Reveal delay={80} className="lg:col-span-4">
            {ARTISTS[1] ? (
              <PortraitBlock
                name={ARTISTS[1].name}
                meta={ARTISTS[1].meta}
                src={ARTISTS[1].src}
                size="md"
                className="aspect-[4/3] w-full"
              />
            ) : null}
          </Reveal>

          <Reveal delay={160} className="lg:col-span-4">
            {ARTISTS[2] ? (
              <PortraitBlock
                name={ARTISTS[2].name}
                meta={ARTISTS[2].meta}
                src={ARTISTS[2].src}
                size="md"
                className="aspect-[4/3] w-full"
              />
            ) : null}
          </Reveal>

          <Reveal delay={120} className="lg:col-span-4">
            {ARTISTS[3] ? (
              <PortraitBlock
                name={ARTISTS[3].name}
                meta={ARTISTS[3].meta}
                src={ARTISTS[3].src}
                size="md"
                className="aspect-[4/3] w-full"
              />
            ) : null}
          </Reveal>

          <Reveal delay={200} className="col-span-2 lg:col-span-4">
            {ARTISTS[4] ? (
              <PortraitBlock
                name={ARTISTS[4].name}
                meta={ARTISTS[4].meta}
                src={ARTISTS[4].src}
                size="md"
                className="aspect-[4/3] w-full"
              />
            ) : null}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
