'use client'

import { useState, type KeyboardEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import type { ArtistSkillInput } from '@castflow/validators'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useReplaceSkills } from '@/lib/hooks/use-artist'
import { StepNav } from '../step-nav'
import type { MyArtistProfile } from '@/lib/api/artists'

interface StepSkillsProps {
  profile: MyArtistProfile
  onBack: () => void
  onNext: () => void
}

type SkillType = ArtistSkillInput['skillType']

interface CategoryDef {
  type: SkillType
  label: string
  placeholder: string
  helper: string
}

const CATEGORIES: ReadonlyArray<CategoryDef> = [
  {
    type: 'accent',
    label: 'Accents',
    placeholder: 'RP, Cockney, Scouse…',
    helper: 'Accents you can perform on demand.',
  },
  {
    type: 'language',
    label: 'Languages',
    placeholder: 'French (fluent), Spanish (conversational)…',
    helper: 'Languages you speak and how fluently.',
  },
  {
    type: 'special_skill',
    label: 'Special skills',
    placeholder: 'Stage combat, horse riding, juggling…',
    helper: 'Physical or technical skills useful on a shoot.',
  },
  {
    type: 'training',
    label: 'Training',
    placeholder: 'Drama school, BA in Acting, RADA…',
    helper: 'Formal acting training or qualifications.',
  },
]

function normaliseExistingSkills(profile: MyArtistProfile): ArtistSkillInput[] {
  return profile.skills
    .map((s) => {
      const skill = s as { skillType?: string; skillValue?: string }
      if (!skill.skillType || !skill.skillValue) return null
      if (
        skill.skillType !== 'accent' &&
        skill.skillType !== 'language' &&
        skill.skillType !== 'special_skill' &&
        skill.skillType !== 'training'
      ) {
        return null
      }
      return { skillType: skill.skillType, skillValue: skill.skillValue }
    })
    .filter((s): s is ArtistSkillInput => s !== null)
}

export function StepSkills({ profile, onBack, onNext }: StepSkillsProps) {
  const mutation = useReplaceSkills()
  const [skills, setSkills] = useState<ArtistSkillInput[]>(() =>
    normaliseExistingSkills(profile)
  )

  const handleSave = () => {
    mutation.mutate(
      { skills },
      {
        onSuccess: () => {
          toast.success('Skills saved')
          onNext()
        },
      }
    )
  }

  const addSkill = (type: SkillType, value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    if (skills.some((s) => s.skillType === type && s.skillValue.toLowerCase() === trimmed.toLowerCase())) {
      return
    }
    setSkills((curr) => [...curr, { skillType: type, skillValue: trimmed }])
  }

  const removeSkill = (type: SkillType, value: string) => {
    setSkills((curr) => curr.filter((s) => !(s.skillType === type && s.skillValue === value)))
  }

  return (
    <div className="space-y-6">
      {CATEGORIES.map((cat) => (
        <SkillCategory
          key={cat.type}
          definition={cat}
          values={skills.filter((s) => s.skillType === cat.type).map((s) => s.skillValue)}
          onAdd={(v) => addSkill(cat.type, v)}
          onRemove={(v) => removeSkill(cat.type, v)}
        />
      ))}

      <p className="text-xs text-white/70">
        Casters search by these tags. Be specific — &ldquo;RP&rdquo; beats &ldquo;British&rdquo;.
      </p>

      <StepNav
        onBack={onBack}
        onNext={handleSave}
        nextType="button"
        isSubmitting={mutation.isPending}
      />
    </div>
  )
}

interface SkillCategoryProps {
  definition: CategoryDef
  values: string[]
  onAdd: (value: string) => void
  onRemove: (value: string) => void
}

function SkillCategory({ definition, values, onAdd, onRemove }: SkillCategoryProps) {
  const [input, setInput] = useState('')

  const submit = () => {
    onAdd(input)
    setInput('')
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-sm font-medium text-white/85">{definition.label}</Label>
        <span className="text-xs tabular-nums text-white/70">{values.length}</span>
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={definition.placeholder}
        />
        <Button
          type="button"
          variant="outline"
          onClick={submit}
          disabled={!input.trim()}
          className="border-white/15 bg-white/[0.04] text-white/75 hover:bg-white/[0.08] hover:text-white"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.06] py-1 pr-1 pl-3 text-xs text-white/85"
            >
              {v}
              <button
                type="button"
                onClick={() => onRemove(v)}
                className="rounded-full p-0.5 text-white/50 transition hover:bg-white/10 hover:text-white"
                aria-label={`Remove ${v}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-white/70">{definition.helper}</p>
    </div>
  )
}
