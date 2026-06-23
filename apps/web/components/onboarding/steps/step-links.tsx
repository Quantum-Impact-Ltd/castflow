'use client'

import { useState } from 'react'
import { Link2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { replaceLinksSchema, type ReplaceLinksInput } from '@castflow/validators'
import type { ProfileLinkType } from '@castflow/types'
import { useReplaceLinks } from '@/lib/hooks/use-artist'
import { LINK_PLATFORMS, LINK_PLATFORM_LABEL } from '@/lib/portfolio-meta'
import { StepNav } from '../step-nav'
import type { MyArtistProfile } from '@/lib/api/artists'

interface StepLinksProps {
  profile: MyArtistProfile
  onBack: () => void
  onNext: () => void
}

export function StepLinks({ profile, onBack, onNext }: StepLinksProps) {
  const replace = useReplaceLinks()
  const [links, setLinks] = useState<ReplaceLinksInput['links']>(() =>
    (profile.links ?? []).map((l) => ({
      platform: l.platform,
      url: l.url,
      ...(l.label ? { label: l.label } : {}),
    }))
  )
  const [draftPlatform, setDraftPlatform] = useState<ProfileLinkType>('website')
  const [draftUrl, setDraftUrl] = useState('')

  const addLink = () => {
    const url = draftUrl.trim()
    if (!url) return
    if (links.length >= 12) {
      toast.error('You can add up to 12 links.')
      return
    }
    setLinks((prev) => [...prev, { platform: draftPlatform, url }])
    setDraftUrl('')
  }

  const removeLink = (index: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== index))
  }

  // Persist on continue. Links are optional, so an empty set is fine — we still
  // save (clears any previously-added links the artist removed) then advance.
  const saveAndNext = () => {
    const result = replaceLinksSchema.safeParse({ links })
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? 'Check your links are valid URLs')
      return
    }
    replace.mutate(result.data, { onSuccess: () => onNext() })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={draftPlatform}
          onChange={(e) => setDraftPlatform(e.target.value as ProfileLinkType)}
          className="rounded-lg border border-white/15 bg-[var(--ink-900)] px-3 py-2 text-sm text-white focus:border-[var(--cta-400)]/60 focus:outline-none sm:w-44"
        >
          {LINK_PLATFORMS.map((p) => (
            <option key={p} value={p} className="bg-[var(--ink-900)]">
              {LINK_PLATFORM_LABEL[p]}
            </option>
          ))}
        </select>
        <input
          value={draftUrl}
          onChange={(e) => setDraftUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addLink()
            }
          }}
          type="url"
          placeholder="https://…"
          className="flex-1 rounded-lg border border-white/15 bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[var(--cta-400)]/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={addLink}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.1]"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {links.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-10 text-center">
          <Link2 className="h-6 w-6 text-white/70" />
          <p className="text-sm text-white/55">No links yet — this step is optional.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {links.map((link, i) => (
            <li
              key={`${link.platform}-${link.url}-${i}`}
              className="flex items-center gap-2 rounded-lg border border-white/12 bg-white/[0.03] py-1.5 pl-3 pr-1.5 text-sm"
            >
              <Link2 className="h-3.5 w-3.5 shrink-0 text-white/70" />
              <span className="w-20 shrink-0 text-[10px] uppercase tracking-wide text-white/70">
                {LINK_PLATFORM_LABEL[link.platform]}
              </span>
              <span className="min-w-0 flex-1 truncate text-white/85">{link.url}</span>
              <button
                type="button"
                onClick={() => removeLink(i)}
                aria-label={`Remove ${link.url}`}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/55 hover:bg-white/10 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <StepNav
        onBack={onBack}
        onNext={saveAndNext}
        nextType="button"
        isSubmitting={replace.isPending}
      />
    </div>
  )
}
