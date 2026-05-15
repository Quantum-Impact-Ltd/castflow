import { Marquee } from '../marquee'

// Placeholder UK creative-industry names. Swap with real parent-agency clients.
const BRANDS = [
  'Saunders & Co',
  'Northbeam Labs',
  'Hartwell Agency',
  'Greycoat Studios',
  'Field Notes Co.',
  'Marlowe Atelier',
  'Holloway Films',
  'Pavilion Brand',
  'Cooper & Stone',
  'Tessellate Studio',
  'Atlas Press',
  'Bermondsey Studios',
  'Carlow & Vine',
  'Drift House',
  'Everleigh Creative',
  'Fenwick Atelier',
  'Glasshouse Films',
  'Heatherwick Brand',
  'Ironside Productions',
  'Juno Editorial',
]

export function TrustMarqueeSection() {
  return (
    <section className="w-full border-b border-border/60 bg-background">
      <div className="mx-auto w-full max-w-[90rem] px-6 py-10 lg:px-8 lg:py-14">
        <div className="flex items-center gap-3">
          <span
            className="h-px w-10 bg-foreground/40"
            aria-hidden
          />
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.22em] text-foreground/80">
            Trusted by teams from
          </p>
        </div>
        <div className="relative mt-5">
          <Marquee
            items={BRANDS}
            durationSeconds={110}
            gap={56}
            itemClassName="font-serif text-lg italic text-foreground/80 md:text-xl"
            separator={
              <span className="text-foreground/30 text-lg md:text-xl" aria-hidden>
                ·
              </span>
            }
          />
          {/* Edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent" />
        </div>
      </div>
    </section>
  )
}
