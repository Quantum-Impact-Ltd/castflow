import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text'
import { ShimmerButtonLink } from '@/components/landing/shimmer-button-link'

const easeOutExpo = '[animation-timing-function:cubic-bezier(0.16,1,0.3,1)]'
const easeOutQuart = '[animation-timing-function:cubic-bezier(0.22,1,0.36,1)]'
const motionGuard =
  'motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:translate-y-0'

// Industry-context photography (lighting rig + studio camera). Stays on PRODUCT.md
// rules: no fake talent faces, just the apparatus of the trade.
// Photo: Alexander Dummer / Unsplash — https://unsplash.com/photos/aS4Duj2j7r4
const HERO_PHOTO =
  'https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?auto=format&fit=crop&w=2400&q=80'

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden border-b border-border/40 bg-background">
      <div className="grid w-full lg:grid-cols-[1fr_1.1fr]">
        {/* TYPE COLUMN — sits on tinted page surface, generous left padding, anchors to top-left */}
        <div className="flex flex-col justify-between px-6 pt-12 pb-14 sm:px-10 lg:px-16 lg:pt-24 lg:pb-20 xl:pl-24 xl:pr-20">
          <div className="max-w-[34rem]">
            <div
              className={`mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-[var(--surface-50)] px-4 py-1.5 animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-[700ms] ${easeOutQuart} ${motionGuard}`}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
              <AnimatedShinyText
                shimmerWidth={120}
                className="font-mono text-[11px] font-medium uppercase tracking-[0.18em]"
              >
                Live · UK casting marketplace
              </AnimatedShinyText>
            </div>
            <h1
              className="font-medium tracking-[-0.035em] text-foreground"
              style={{
                fontSize: 'clamp(2.75rem, 6.5vw, 5.5rem)',
                lineHeight: '0.96',
              }}
            >
              <span
                className={`block animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-[900ms] [animation-delay:80ms] ${easeOutExpo} ${motionGuard}`}
              >
                Cast your next
              </span>
              <span
                className={`block animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-[900ms] [animation-delay:200ms] ${easeOutExpo} ${motionGuard}`}
              >
                shoot in days,
              </span>
              <span
                className={`block font-semibold text-[color:var(--brand-700)] animate-in fade-in slide-in-from-bottom-5 fill-mode-both duration-[1000ms] [animation-delay:340ms] ${easeOutExpo} ${motionGuard}`}
              >
                not weeks.
              </span>
            </h1>

            <p
              className={`mt-10 max-w-[42ch] text-pretty text-lg leading-relaxed text-foreground/75 sm:text-xl animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-[700ms] [animation-delay:520ms] ${easeOutQuart} ${motionGuard}`}
            >
              Verified UK models and actors. Contracts, escrow payments, and
              reviews, built in. The professional rail for commercial casting.
            </p>

            <div
              className={`mt-10 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-bottom-3 fill-mode-both duration-[700ms] [animation-delay:640ms] ${easeOutQuart} ${motionGuard}`}
            >
              <ShimmerButtonLink
                href="/register?role=caster"
                className="h-12 px-7 text-base font-medium"
              >
                Post your first shoot
                <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
              </ShimmerButtonLink>
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

          {/* Foot meta — anchored to bottom of the type column, only visible on lg+ where the
              column is tall enough to deserve it. Reads like a magazine masthead. */}
          <div className="mt-20 hidden items-center gap-6 text-sm text-foreground/55 lg:flex">
            <span className="font-medium text-foreground/70">CastFlow</span>
            <span aria-hidden className="h-px w-8 bg-foreground/20" />
            <span>UK casting marketplace</span>
            <span aria-hidden>·</span>
            <span>Est. 2026</span>
          </div>
        </div>

        {/* PHOTO COLUMN — full-bleed to the right viewport edge, full-height of the type column.
            On mobile this stacks above the type column for a photography-first first paint. */}
        <div
          className={`relative order-first min-h-[60vw] sm:min-h-[55vw] lg:order-last lg:min-h-[min(46rem,80vh)] animate-in fade-in fill-mode-both duration-[1200ms] [animation-delay:0ms] ${easeOutExpo} ${motionGuard}`}
        >
          <Image
            src={HERO_PHOTO}
            alt="Studio camera and lighting rig on a working set"
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover"
          />
          {/* Bottom-up tonal scrim, just enough to anchor the credit without flattening the image */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
          />
          {/* Editorial photo credit — bottom-right, like a magazine plate caption */}
          <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 px-6 pb-6 text-white/85 sm:px-10 lg:px-12 lg:pb-10">
            <span className="text-sm leading-tight sm:text-base">
              On set, Hackney Wick.
              <span className="block text-white/55">
                A Holloway Films shoot, booked through CastFlow.
              </span>
            </span>
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-white/55 sm:inline-block">
              Plate&nbsp;01
            </span>
          </figcaption>
        </div>
      </div>
    </section>
  )
}
