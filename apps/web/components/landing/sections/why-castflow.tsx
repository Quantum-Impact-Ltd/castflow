import { Reveal } from '../reveal'

const PILLARS = [
  {
    n: '01',
    title: 'Pre-vetted talent',
    body: 'Every artist clears an ID and portfolio review before they appear in search. Verified badge on every profile. No fake accounts, no bait-and-switch.',
  },
  {
    n: '02',
    title: 'Money held in escrow',
    body: 'Payment goes into Stripe escrow at booking. Neither side can touch it until the shoot is confirmed complete, or 48 hours pass and the artist is auto-paid.',
  },
  {
    n: '03',
    title: 'Contracts, built in',
    body: 'Every booking generates a contract with usage rights, NDA, and exclusivity terms. Both parties sign before the address is revealed. Permanent record.',
  },
]

export function WhyCastflowSection() {
  return (
    <section className="relative w-full bg-primary py-28 text-white lg:py-44">
      <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
        <Reveal>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-white/70">
                Why CastFlow
              </p>
              <h2 className="mt-6 text-balance text-5xl font-medium leading-[0.98] tracking-[-0.03em] sm:text-6xl lg:text-[6rem]">
                The old way is{' '}
                <span className="font-serif font-normal italic">
                  broken.
                </span>
                <br />
                We rebuilt it.
              </h2>
            </div>
            <p className="text-lg leading-relaxed text-white/85 lg:col-span-5 lg:pt-2">
              Casting today runs on WhatsApp threads and cash-on-the-day
              handshakes. No paper trail. No accountability. We rebuilt it on
              three things the industry never had.
            </p>
          </div>
        </Reveal>

        <div className="mt-20 border-t border-white/20">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.n} delay={i * 80}>
              <article className="grid gap-6 border-b border-white/20 py-12 lg:grid-cols-12 lg:gap-10 lg:py-16">
                <div className="lg:col-span-2">
                  <span className="font-mono text-sm font-medium text-white/60">
                    {pillar.n}
                  </span>
                </div>
                <h3 className="text-3xl font-medium tracking-[-0.02em] sm:text-4xl lg:col-span-5 lg:text-5xl">
                  {pillar.title}
                </h3>
                <p className="text-base leading-relaxed text-white/75 sm:text-lg lg:col-span-5">
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
