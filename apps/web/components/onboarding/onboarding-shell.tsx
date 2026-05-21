'use client'

import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { type ReactNode } from 'react'
import { Particles } from '@/components/ui/particles'
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern'
import { cn } from '@/lib/utils'
import { OnboardingStepper, type StepDef } from './onboarding-stepper'

interface OnboardingShellProps {
  steps: ReadonlyArray<StepDef>
  currentIndex: number
  onStepClick?: (index: number) => void
  maxUnlockedIndex?: number
  title: string
  subtitle?: string
  /** Right-side contextual panel (tips, illustration). */
  tips?: ReactNode
  /** Footer with Back / Next buttons. Optional — steps may render their own. */
  footer?: ReactNode
  /** Optional auto-save indicator content. */
  savedAt?: ReactNode
  /** "Back to …" link target in the header. Defaults to /. */
  exitHref?: string
  exitLabel?: string
  children: ReactNode
}

export function OnboardingShell({
  steps,
  currentIndex,
  onStepClick,
  maxUnlockedIndex,
  title,
  subtitle,
  tips,
  footer,
  savedAt,
  exitHref = '/',
  // Default to plain "Exit" — we don't autosave on click. Pages with
  // dirty form state register `useBeforeUnloadWarning` so the browser
  // shows the native "Leave site? Changes you made may not be saved"
  // prompt before navigating away. (Audit M19.)
  exitLabel = 'Exit',
  children,
}: OnboardingShellProps) {
  return (
    // The `dark` class flips shadcn primitives (Input, Select, Button, etc.)
    // to their dark theme tokens. We then layer the ink-900 atmosphere on
    // top so the visual language matches the AuthShell used for register.
    <div className="dark relative isolate min-h-screen w-full overflow-hidden bg-[var(--ink-900)] text-white">
      {/* Atmospheric layers — soft color washes, grid pattern, particles */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full bg-[#2a6b96] opacity-[0.22] blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-[-12rem] h-[32rem] w-[32rem] rounded-full bg-[#f9a26c] opacity-[0.14] blur-[140px]"
      />
      <AnimatedGridPattern
        numSquares={28}
        maxOpacity={0.05}
        duration={6}
        repeatDelay={1.2}
        className={cn(
          'pointer-events-none [mask-image:radial-gradient(900px_circle_at_center,white,transparent)]',
          'inset-x-0 inset-y-[-20%] h-[140%] -skew-y-12 fill-white/30 stroke-white/30'
        )}
      />
      <Particles
        className="absolute inset-0"
        quantity={45}
        ease={80}
        color="#f9a26c"
        staticity={50}
        size={0.5}
      />

      {/* Header: brand + exit + stepper rail */}
      <header className="relative z-10 border-b border-white/8 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 lg:px-6">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm font-medium tracking-tight text-white transition-opacity hover:opacity-90"
          >
            <span
              className="inline-block h-2 w-2 rounded-full bg-[#f9a26c] transition-transform duration-500 group-hover:scale-150"
              aria-hidden
            />
            CastFlow
          </Link>
          <div className="flex items-center gap-4 text-xs text-white/55">
            {savedAt}
            <Link
              href={exitHref}
              className="inline-flex items-center gap-1 transition-colors hover:text-white"
            >
              <ChevronLeft className="h-3 w-3" aria-hidden />
              {exitLabel}
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 pb-5 lg:px-6">
          <OnboardingStepper
            steps={steps}
            currentIndex={currentIndex}
            onStepClick={onStepClick}
            maxUnlockedIndex={maxUnlockedIndex}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-10 lg:px-6 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div>
            <div className="mb-7">
              <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-white/45 uppercase">
                Step {currentIndex + 1} of {steps.length}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-sm leading-relaxed text-white/65 sm:text-base">
                  {subtitle}
                </p>
              )}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {children}
              </motion.div>
            </AnimatePresence>

            {footer && (
              <div className="mt-8 border-t border-white/10 pt-6">{footer}</div>
            )}
          </div>

          {tips && (
            <aside className="hidden lg:block">
              <div className="sticky top-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] p-6 backdrop-blur-xl shadow-[0_28px_90px_-30px_rgba(0,0,0,0.7)]"
                  >
                    {tips}
                  </motion.div>
                </AnimatePresence>
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  )
}
