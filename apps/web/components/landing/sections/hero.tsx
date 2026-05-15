import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Easing curves (PRODUCT.md spec): ease-out-expo for the display moment,
// ease-out-quart for the supporting sub-row reveal.
const easeOutExpo = '[animation-timing-function:cubic-bezier(0.16,1,0.3,1)]'
const easeOutQuart = '[animation-timing-function:cubic-bezier(0.22,1,0.36,1)]'
const motionGuard = 'motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:translate-y-0'

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden border-b border-border/40 bg-background">
      <div className="mx-auto w-full max-w-[90rem] px-6 pt-14 pb-20 lg:px-8 lg:pt-24 lg:pb-32">
        {/* Display headline. Three lines. Sans for the first two, Instrument Serif italic in
            brand-700 for the third. The italic line is the committed brand moment (color + cut
            + scale). Reveals stagger sans first, then the italic moment lands. */}
        <h1
          className="font-medium leading-[0.92] tracking-[-0.04em] text-foreground"
          style={{ fontSize: 'clamp(3.25rem, 11vw, 8.5rem)' }}
        >
          <span
            className={`block animate-in fade-in slide-in-from-bottom-6 fill-mode-both duration-[900ms] [animation-delay:0ms] ${easeOutExpo} ${motionGuard}`}
          >
            Cast your next
          </span>
          <span
            className={`block animate-in fade-in slide-in-from-bottom-6 fill-mode-both duration-[900ms] [animation-delay:120ms] ${easeOutExpo} ${motionGuard}`}
          >
            shoot in days,
          </span>
          <span
            className={`block font-serif font-normal italic text-[color:var(--brand-700)] animate-in fade-in slide-in-from-bottom-8 fill-mode-both duration-[1100ms] [animation-delay:320ms] ${easeOutExpo} ${motionGuard}`}
            style={{
              fontSize: 'clamp(3.5rem, 12vw, 9.25rem)',
              letterSpacing: '-0.025em',
              lineHeight: '0.95',
            }}
          >
            not weeks.
          </span>
        </h1>

        {/* Structural sub-row. Lede left (7 cols), CTAs anchored right on desktop (5 cols).
            Sub-row reveals quieter and shorter than the headline — supports, doesn't compete. */}
        <div className="mt-12 grid gap-8 lg:mt-20 lg:grid-cols-12 lg:gap-12">
          <p
            className={`max-w-[60ch] text-balance text-lg leading-relaxed text-foreground/80 sm:text-xl lg:col-span-7 animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-[700ms] [animation-delay:520ms] ${easeOutQuart} ${motionGuard}`}
          >
            Verified UK models and actors. Contracts, escrow payments, and
            reviews, built in. The professional rail for commercial casting.
          </p>

          <div
            className={`flex flex-wrap items-center gap-3 lg:col-span-5 lg:justify-end animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-[700ms] [animation-delay:620ms] ${easeOutQuart} ${motionGuard}`}
          >
            <Button asChild size="lg" className="h-12 rounded-full px-7 text-base">
              <Link href="/register?role=caster">
                Post your first shoot
                <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="h-12 rounded-full px-5 text-base"
            >
              <Link href="/how-it-works">See how it works</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
