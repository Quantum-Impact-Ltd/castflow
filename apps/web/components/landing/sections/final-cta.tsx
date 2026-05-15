import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Reveal } from '../reveal'

export function FinalCtaSection() {
  return (
    <section className="relative w-full overflow-hidden bg-background py-28 lg:py-44">
      {/* Subtle dot-grid texture, very low contrast */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(13, 27, 38, 0.06) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative mx-auto w-full max-w-4xl px-6 text-center lg:px-8">
        <Reveal>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-primary">
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
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full px-7 text-base"
            >
              <Link href="/register?role=caster">
                Get started
                <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
              </Link>
            </Button>
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
