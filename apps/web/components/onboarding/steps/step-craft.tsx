'use client'

import { useState } from 'react'
import { Camera, Drama } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateArtistType } from '@/lib/hooks/use-artist'
import { cn } from '@/lib/utils'
import { StepNav } from '../step-nav'

interface StepCraftProps {
  currentType: 'model' | 'actor'
  onNext: () => void
}

const OPTIONS = [
  {
    value: 'model' as const,
    label: 'Model',
    icon: Camera,
    blurb: 'Fashion, commercial, editorial, e-commerce. Build a portfolio that lands campaigns.',
    examples: 'Campaign · Editorial · TVC · E-commerce',
  },
  {
    value: 'actor' as const,
    label: 'Actor',
    icon: Drama,
    blurb: 'TVC, film, voiceover, extra work. Showcase your reel, skills, and age range.',
    examples: 'TVC · Voiceover · Film · Extra',
  },
]

export function StepCraft({ currentType, onNext }: StepCraftProps) {
  const [selected, setSelected] = useState<'model' | 'actor'>(currentType)
  const mutation = useUpdateArtistType()

  const handleContinue = () => {
    if (selected === currentType) {
      onNext()
      return
    }
    mutation.mutate(
      { artistType: selected },
      {
        onSuccess: () => {
          toast.success(`Set up as ${selected}`)
          onNext()
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon
          const isSelected = selected === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              className={cn(
                'group relative flex flex-col items-start gap-3 rounded-2xl border p-6 text-left transition',
                'backdrop-blur-xl',
                isSelected
                  ? 'border-[var(--cta-400)]/60 bg-[var(--cta-400)]/[0.06] ring-2 ring-[var(--cta-400)]/20'
                  : 'border-white/12 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.05]'
              )}
            >
              <div
                className={cn(
                  'grid h-10 w-10 place-items-center rounded-lg border transition',
                  isSelected
                    ? 'border-[var(--cta-400)] bg-[var(--cta-400)] text-[var(--ink-900)]'
                    : 'border-white/15 bg-white/[0.04] text-white/75'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold tracking-tight text-white">
                  {opt.label}
                </h3>
                <p className="text-sm leading-relaxed text-white/60">{opt.blurb}</p>
              </div>
              <p className="mt-1 font-mono text-[10px] tracking-[0.18em] text-white/35 uppercase">
                {opt.examples}
              </p>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-white/45">
        You can change this later — but only before submitting your profile for review.
      </p>

      <StepNav
        nextType="button"
        onNext={handleContinue}
        isSubmitting={mutation.isPending}
      />
    </div>
  )
}
