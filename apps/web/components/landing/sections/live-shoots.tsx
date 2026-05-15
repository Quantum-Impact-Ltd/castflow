import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Reveal } from '../reveal'
import { cn } from '@/lib/utils'

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
}

const SAMPLE_SHOOTS: SampleShoot[] = [
  {
    id: '1',
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
  },
  {
    id: '2',
    title: 'Voiceover actor — Tech explainer',
    company: 'Northbeam Labs',
    category: 'Voiceover · Actor',
    city: 'Remote',
    date: 'Open dates',
    rate: 'Open',
    rateNote: 'to bids',
    spots: 1,
  },
  {
    id: '3',
    title: 'TVC lead talent — Drinks brand',
    company: 'Hartwell Agency',
    category: 'TVC · Actor',
    city: 'Manchester',
    date: '28 Jun',
    rate: '£85/hr',
    rateNote: '8 hours',
    spots: 2,
  },
  {
    id: '4',
    title: 'Editorial campaign — Footwear',
    company: 'Cooper & Stone',
    category: 'Editorial · Model',
    city: 'Bristol',
    date: '04 Jul',
    rate: '£650',
    rateNote: 'flat fee',
    spots: 1,
  },
  {
    id: '5',
    title: 'Voice talent — Audiobook narration',
    company: 'Pavilion Brand',
    category: 'Voiceover · Actor',
    city: 'Remote',
    date: 'Rolling',
    rate: '£120/hr',
    rateNote: 'estimated 12h',
    spots: 1,
  },
  {
    id: '6',
    title: 'Hand model — Jewellery campaign',
    company: 'Marlowe Atelier',
    category: 'Commercial · Model',
    city: 'London',
    date: '15 Jul',
    rate: '£420',
    rateNote: 'flat fee',
    spots: 2,
  },
]

function ShootCard({
  shoot,
  featured = false,
}: {
  shoot: SampleShoot
  featured?: boolean
}) {
  return (
    <Link
      href={`/shoots/${shoot.id}`}
      className={cn(
        'group relative flex h-full flex-col justify-between gap-8 border border-border bg-background p-8 transition-all duration-300',
        'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm',
        featured ? 'lg:p-12' : 'p-6 lg:p-8',
      )}
    >
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-foreground/75">
          {shoot.category}
        </p>
        <h3
          className={cn(
            'mt-4 font-medium tracking-[-0.015em] text-foreground',
            featured
              ? 'text-3xl leading-[1.1] sm:text-4xl lg:text-5xl'
              : 'text-xl leading-tight sm:text-2xl',
          )}
        >
          {shoot.title}
        </h3>
        <p className="mt-2 text-sm font-medium text-foreground/85">
          {shoot.company}
        </p>
        {featured && shoot.description ? (
          <p className="mt-6 max-w-md text-base leading-relaxed text-foreground/70">
            {shoot.description}
          </p>
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-foreground/75">
            {shoot.city} · {shoot.date}
          </p>
          <p className="flex items-baseline gap-2">
            <span
              className={cn(
                'font-mono font-medium text-foreground',
                featured ? 'text-3xl' : 'text-xl',
              )}
            >
              {shoot.rate}
            </span>
            {shoot.rateNote ? (
              <span className="text-xs font-medium text-foreground/70">
                {shoot.rateNote}
              </span>
            ) : null}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          {shoot.spots} {shoot.spots === 1 ? 'spot' : 'spots'} open
        </span>
      </div>

      <ArrowRight
        className="absolute right-6 top-6 h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary lg:right-8 lg:top-8"
        aria-hidden
      />
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
              <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-primary">
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
