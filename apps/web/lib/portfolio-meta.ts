import type { PortfolioEntryType, ProfileLinkType } from '@castflow/types'

// Shared portfolio + professional-link presentation metadata, used by the
// profile editor, onboarding, and the bid portfolio picker so the labels stay
// consistent everywhere.

export const ENTRY_TYPES: PortfolioEntryType[] = [
  'shoot',
  'film',
  'editorial',
  'campaign',
  'runway',
  'commercial',
  'other',
]

export const ENTRY_TYPE_LABEL: Record<PortfolioEntryType, string> = {
  shoot: 'Shoot',
  film: 'Film / TV',
  editorial: 'Editorial',
  campaign: 'Campaign',
  runway: 'Runway',
  commercial: 'Commercial',
  other: 'Other',
}

export const LINK_PLATFORMS: ProfileLinkType[] = [
  'website',
  'instagram',
  'youtube',
  'vimeo',
  'behance',
  'tiktok',
  'linkedin',
  'imdb',
  'spotlight',
  'other',
]

export const LINK_PLATFORM_LABEL: Record<ProfileLinkType, string> = {
  website: 'Website',
  instagram: 'Instagram',
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  behance: 'Behance',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  imdb: 'IMDb',
  spotlight: 'Spotlight',
  other: 'Link',
}
