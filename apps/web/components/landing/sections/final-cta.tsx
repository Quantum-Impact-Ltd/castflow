import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Reveal } from '../reveal'
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern'
import { ShimmerButtonLink } from '@/components/landing/shimmer-button-link'
import { cn } from '@/lib/utils'

export function FinalCtaSection() {
  return (
    <section className="relative w-full overflow-hidden bg-background py-28 lg:py-44">
      <AnimatedGridPattern
        numSquares={32}
        maxOpacity={0.08}
        duration={5}
        repeatDelay={1}
        className={cn(
          'pointer-events-none [mask-image:radial-gradient(700px_circle_at_center,white,transparent)]',
          'inset-x-0 inset-y-[-30%] h-[160%] skew-y-6',
        )}
      />

      <div className="relative mx-auto w-full max-w-4xl px-6 text-center lg:px-8">
        <Reveal>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-foreground/55">
            Start casting
          </p>
          <h2 className="mt-6 text-balance text-5xl font-medium leading-[1.02] tracking-[-0.025em] text-foreground sm:text-6xl lg:text-[6rem]">
            Ready to post your{' '}
            <span className="font-serif font-normal italic">first</span> shoot?
          </h2>
          <p className="mt-8 text-lg text-muted-foreground sm:text-xl">
            Browse talent free. No card required to sign up.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <ShimmerButtonLink
              href="/register?role=caster"
              className="h-12 px-7 text-base font-medium"
            >
              Get started
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
            </ShimmerButtonLink>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="h-12 rounded-full px-6 text-base"
            >
              <Link href="/contact">Talk to us first</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
