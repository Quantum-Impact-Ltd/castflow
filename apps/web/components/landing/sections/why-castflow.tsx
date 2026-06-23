import { Reveal } from '../reveal'
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern'
import { cn } from '@/lib/utils'

const PILLARS = [
  {
    n: '01',
    title: 'Pre-vetted talent',
    body: 'Every artist clears an ID and portfolio review before they appear in search. Verified badge on every profile. No fake accounts, no bait-and-switch.',
  },
  {
    n: '02',
    title: 'Simple, honest pricing',
    body: 'Casters pay one flat subscription to use CastFlow — that’s our only charge. Job fees are paid directly between caster and artist, off-platform. We never hold or take a cut. Artists join free.',
  },
  {
    n: '03',
    title: 'Contracts, built in',
    body: 'Every booking generates a contract with usage rights, NDA, and exclusivity terms. Both parties sign before the address is revealed. Permanent record.',
  },
]

export function WhyCastflowSection() {
  return (
    <section className="relative w-full overflow-hidden bg-primary py-28 text-white lg:py-44">
      <AnimatedGridPattern
        numSquares={26}
        maxOpacity={0.08}
        duration={5}
        repeatDelay={1}
        className={cn(
          'pointer-events-none [mask-image:radial-gradient(900px_circle_at_center,white,transparent)]',
          'inset-x-0 inset-y-[-20%] h-[140%] skew-y-6 fill-white/40 stroke-white/40',
        )}
      />
      <div className="relative mx-auto w-full max-w-[90rem] px-6 lg:px-8">
        <Reveal>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-white/85">
                Why CastFlow
              </p>
              <h2 className="mt-6 text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.03em] text-white sm:text-6xl lg:text-[6rem]">
                The old way is{' '}
                <span className="font-serif font-normal italic">
                  broken.
                </span>
                <br />
                We rebuilt it.
              </h2>
            </div>
            <p className="text-lg font-medium leading-relaxed text-white lg:col-span-5 lg:pt-2">
              Casting today runs on WhatsApp threads and cash-on-the-day
              handshakes. No paper trail. No accountability. We rebuilt it on
              three things the industry never had.
            </p>
          </div>
        </Reveal>

        <div className="mt-20 border-t-2 border-white/60">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.n} delay={i * 80}>
              <article className="grid gap-6 border-b-2 border-white/60 py-12 lg:grid-cols-12 lg:gap-10 lg:py-16">
                <div className="lg:col-span-2">
                  <span className="font-mono text-sm font-semibold text-white">
                    {pillar.n}
                  </span>
                </div>
                <h3 className="text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl lg:col-span-5 lg:text-5xl">
                  {pillar.title}
                </h3>
                <p className="text-base font-medium leading-relaxed text-white sm:text-lg lg:col-span-5">
                  {pillar.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
