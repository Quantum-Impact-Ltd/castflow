import { Reveal } from '../reveal'

const STEPS = [
  {
    n: '01',
    title: 'Post the shoot',
    body: 'A 5-minute wizard. Set rate, requirements, and usage rights. The job goes live and matching artists are notified.',
  },
  {
    n: '02',
    title: 'Review bids',
    body: 'Artists apply with a rate and a cover note. Shortlist your favourites — that unlocks messaging with them.',
  },
  {
    n: '03',
    title: 'Book the artist',
    body: 'Click accept. The booking is confirmed and the agreed rate is locked into the contract for both sides to see.',
  },
  {
    n: '04',
    title: 'Contract signed',
    body: 'Auto-generated with usage rights, NDA, and exclusivity. Both parties sign. The shoot address is revealed.',
  },
  {
    n: '05',
    title: 'Shoot day',
    body: 'Talent shows up on call. You run the shoot. Everything is on the record, in writing.',
  },
  {
    n: '06',
    title: 'Pay the artist directly',
    body: 'Confirm completion for the record, then settle the agreed fee directly with the artist, off-platform. CastFlow never touches job fees.',
  },
]

export function FlowSection() {
  return (
    <section className="w-full bg-[var(--surface-50)] py-24 lg:py-36">
      <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
        <Reveal>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-5">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
                How it works
              </p>
              <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl lg:text-6xl">
                From posted to paid, in six steps.
              </h2>
            </div>
            <p className="text-lg leading-relaxed text-muted-foreground lg:col-span-6 lg:col-start-7 lg:pt-2">
              Every booking on CastFlow runs through the same six steps. Same
              contract template, same clear terms every time. No bespoke chases,
              no surprises.
            </p>
          </div>
        </Reveal>

        {/* Vertical editorial timeline — alternating layout, hairline separators */}
        <div className="mt-20 border-t border-border/60">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={i * 40}>
              <article className="group grid gap-6 border-b border-border/60 py-10 lg:grid-cols-12 lg:gap-10 lg:py-14">
                <div className="lg:col-span-2">
                  <span className="font-mono text-sm font-medium text-primary">
                    {step.n}
                  </span>
                </div>
                <h3 className="text-3xl font-medium tracking-[-0.02em] text-foreground sm:text-4xl lg:col-span-5 lg:text-5xl">
                  {step.title}
                </h3>
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg lg:col-span-5">
                  {step.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
