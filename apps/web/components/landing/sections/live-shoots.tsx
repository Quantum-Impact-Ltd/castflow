import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { Reveal } from '../reveal'

interface SampleShoot {
  id: string
  title: string
  company: string
  category: string
  city: string
  date: string
  rate: string
  rateNote?: string
  spots: number
  description?: string
  imageUrl: string
}

const SAMPLE_SHOOTS: SampleShoot[] = [
  {
    id: 'shoot-001',
    title: 'Female model — Summer campaign',
    company: 'Saunders & Co',
    category: 'Fashion · Model',
    city: 'London',
    date: '12 Jun',
    rate: '£500',
    rateNote: 'flat fee',
    spots: 3,
    description:
      'Two-day swimwear and resort campaign shooting in Camden. Editorial-leaning, natural light. Looking for ages 22–28, full-body confident.',
    imageUrl:
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'shoot-002',
    title: 'Voiceover actor — Tech explainer',
    company: 'Northbeam Labs',
    category: 'Voiceover · Actor',
    city: 'Remote',
    date: 'Open dates',
    rate: 'Open',
    rateNote: 'to bids',
    spots: 1,
    imageUrl:
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'shoot-003',
    title: 'TVC lead talent — Drinks brand',
    company: 'Hartwell Agency',
    category: 'TVC · Actor',
    city: 'Manchester',
    date: '28 Jun',
    rate: '£85/hr',
    rateNote: '8 hours',
    spots: 2,
    imageUrl:
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'shoot-004',
    title: 'Editorial campaign — Footwear',
    company: 'Cooper & Stone',
    category: 'Editorial · Model',
    city: 'Bristol',
    date: '04 Jul',
    rate: '£650',
    rateNote: 'flat fee',
    spots: 1,
    imageUrl:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'shoot-005',
    title: 'Voice talent — Audiobook narration',
    company: 'Pavilion Brand',
    category: 'Voiceover · Actor',
    city: 'Remote',
    date: 'Rolling',
    rate: '£120/hr',
    rateNote: 'estimated 12h',
    spots: 1,
    imageUrl:
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'shoot-006',
    title: 'Hand model — Jewellery campaign',
    company: 'Marlowe Atelier',
    category: 'Commercial · Model',
    city: 'London',
    date: '15 Jul',
    rate: '£420',
    rateNote: 'flat fee',
    spots: 2,
    imageUrl:
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80',
  },
]

function ShootCard({
  shoot,
  featured = false,
}: {
  shoot: SampleShoot
  featured?: boolean
}) {
  if (featured) {
    return (
      <Link
        href={`/shoots/${shoot.id}`}
        className="group relative block h-full overflow-hidden rounded-2xl"
      >
        <div className="relative h-full min-h-[28rem] w-full overflow-hidden">
          <Image
            src={shoot.imageUrl}
            alt={shoot.title}
            fill
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            priority
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"
          />
          {/* Top-left category pill */}
          <span className="absolute left-6 top-6 inline-flex items-center rounded-full bg-white/95 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground backdrop-blur lg:left-8 lg:top-8">
            {shoot.category}
          </span>
          {/* Top-right CTA arrow */}
          <span className="absolute right-6 top-6 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-all group-hover:bg-white group-hover:text-foreground lg:right-8 lg:top-8">
            <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
          {/* Bottom title block */}
          <div className="absolute inset-x-0 bottom-0 p-6 text-white lg:p-10">
            <h3 className="text-balance text-3xl font-medium leading-[1.1] tracking-[-0.015em] sm:text-4xl lg:text-5xl">
              {shoot.title}
            </h3>
            <p className="mt-3 text-sm font-medium text-white/85">
              {shoot.company}
            </p>
            {shoot.description ? (
              <p className="mt-5 max-w-md text-base leading-relaxed text-white/75">
                {shoot.description}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-1">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white/65">
                  {shoot.city} · {shoot.date}
                </p>
                <p className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-medium">
                    {shoot.rate}
                  </span>
                  {shoot.rateNote ? (
                    <span className="text-xs font-medium text-white/70">
                      {shoot.rateNote}
                    </span>
                  ) : null}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                {shoot.spots} {shoot.spots === 1 ? 'spot' : 'spots'} open
              </span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  // Standard card — mirrors the /shoots directory ShootCard pattern exactly.
  return (
    <Link href={`/shoots/${shoot.id}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[var(--surface-50)]">
        <Image
          src={shoot.imageUrl}
          alt={shoot.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"
        />

        {/* Top-left category pill */}
        <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground backdrop-blur">
          {shoot.category}
        </span>

        {/* Bottom rate + spots overlay */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white">
          <p className="font-mono text-2xl font-medium tracking-[-0.02em]">
            {shoot.rate}
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
            {shoot.spots} {shoot.spots === 1 ? 'spot' : 'spots'}
          </span>
        </div>
      </div>

      <div className="mt-5 px-1">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
          {shoot.company}
        </p>
        <h3 className="mt-2 text-lg font-medium leading-snug tracking-[-0.01em] text-foreground transition-colors group-hover:text-foreground/85">
          {shoot.title}
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-foreground/65">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-foreground/40" aria-hidden />
            {shoot.city}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-foreground/40" aria-hidden />
            {shoot.date}
          </span>
        </div>
      </div>
    </Link>
  )
}

export function LiveShootsSection() {
  const [feature, ...secondaries] = SAMPLE_SHOOTS

  return (
    <section className="w-full bg-background py-24 lg:py-36">
      <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
                This week on CastFlow
              </p>
              <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl lg:text-6xl">
                Real shoots,{' '}
                <span className="font-serif font-normal italic">
                  posted by real brands.
                </span>
              </h2>
            </div>
            <Link
              href="/shoots"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              See all live shoots
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:grid-rows-2 lg:gap-8">
          <Reveal className="lg:col-span-2 lg:row-span-2">
            {feature ? <ShootCard shoot={feature} featured /> : null}
          </Reveal>
          {secondaries.slice(0, 2).map((shoot, i) => (
            <Reveal key={shoot.id} delay={(i + 1) * 80}>
              <ShootCard shoot={shoot} />
            </Reveal>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-3 lg:gap-8">
          {secondaries.slice(2, 5).map((shoot, i) => (
            <Reveal key={shoot.id} delay={i * 80}>
              <ShootCard shoot={shoot} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
