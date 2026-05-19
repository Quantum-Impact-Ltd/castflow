import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Nav } from '@/components/landing/nav'
import { Footer } from '@/components/landing/footer'
import { Reveal } from '@/components/landing/reveal'
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text'
import { BorderBeam } from '@/components/ui/border-beam'
import { Button } from '@/components/ui/button'

export interface LegalSection {
  id: string
  title: string
  body: React.ReactNode
}

interface LegalLayoutProps {
  eyebrow: string
  title: string
  titleAccent: string
  intro: string
  lastUpdated: string
  sections: LegalSection[]
}

export function LegalLayout({
  eyebrow,
  title,
  titleAccent,
  intro,
  lastUpdated,
  sections,
}: LegalLayoutProps) {
  return (
    <>
      <Nav />
      <main className="bg-background">
        <Hero
          eyebrow={eyebrow}
          title={title}
          titleAccent={titleAccent}
          intro={intro}
          lastUpdated={lastUpdated}
        />

        <section className="w-full pb-24 lg:pb-32">
          <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              {/* Sticky TOC */}
              <aside className="lg:col-span-3">
                <div className="lg:sticky lg:top-24">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
                    On this page
                  </p>
                  <nav className="mt-4 border-l border-border/60">
                    <ol className="space-y-2.5 text-sm">
                      {sections.map((s, i) => (
                        <li key={s.id} className="-ml-px border-l border-transparent pl-4 transition-colors hover:border-foreground">
                          <a
                            href={`#${s.id}`}
                            className="inline-flex items-baseline gap-3 text-foreground/65 transition-colors hover:text-foreground"
                          >
                            <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-foreground/40">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <span>{s.title}</span>
                          </a>
                        </li>
                      ))}
                    </ol>
                  </nav>
                </div>
              </aside>

              {/* Body */}
              <Reveal delay={80} className="lg:col-span-9">
                <article className="prose-style space-y-14">
                  {sections.map((s, i) => (
                    <section
                      key={s.id}
                      id={s.id}
                      className="scroll-mt-28 border-b border-border/60 pb-14 last:border-b-0 last:pb-0"
                    >
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/45">
                        Section {String(i + 1).padStart(2, '0')}
                      </p>
                      <h2 className="mt-3 text-balance font-serif text-3xl text-foreground sm:text-4xl">
                        {s.title}
                      </h2>
                      <div className="mt-6 space-y-5 text-base leading-[1.7] text-foreground/80 [&_a]:font-medium [&_a]:text-foreground [&_a]:underline-offset-4 hover:[&_a]:underline [&_strong]:text-foreground [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:list-disc [&_ul]:marker:text-foreground/40">
                        {s.body}
                      </div>
                    </section>
                  ))}
                </article>
              </Reveal>
            </div>
          </div>
        </section>

        <FinalCta />
      </main>
      <Footer />
    </>
  )
}

function Hero({
  eyebrow,
  title,
  titleAccent,
  intro,
  lastUpdated,
}: {
  eyebrow: string
  title: string
  titleAccent: string
  intro: string
  lastUpdated: string
}) {
  return (
    <section className="relative w-full overflow-hidden pb-12 pt-20 lg:pb-16 lg:pt-28">
      <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
        <Reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-[var(--surface-50)] px-4 py-1.5">
            <AnimatedShinyText
              shimmerWidth={120}
              className="font-mono text-[11px] font-medium uppercase tracking-[0.18em]"
            >
              {eyebrow}
            </AnimatedShinyText>
          </div>

          <h1 className="mt-6 max-w-4xl text-balance text-5xl font-medium leading-[1.04] tracking-[-0.02em] text-foreground sm:text-6xl lg:text-7xl">
            {title}{' '}
            <span className="font-serif font-normal italic">{titleAccent}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/75">
            {intro}
          </p>
          <p className="mt-8 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground/55">
            Last updated · {lastUpdated}
          </p>
        </Reveal>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="w-full pb-28 lg:pb-36">
      <div className="mx-auto w-full max-w-[90rem] px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-foreground px-10 py-20 text-center text-background lg:px-16">
            <BorderBeam
              duration={10}
              size={160}
              colorFrom="#ffffff"
              colorTo="#ffffff"
            />
            <p className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-background/60">
              Questions?
            </p>
            <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
              Talk to a human{' '}
              <span className="font-serif font-normal italic">anytime.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-background/70">
              Anything unclear in this document? Send us a note — we reply
              within 24 hours, Mon–Fri.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-background text-foreground hover:bg-background/90"
              >
                <Link href="/contact">
                  Contact us
                  <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
              >
                <Link href="/trust">Trust & safety</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
