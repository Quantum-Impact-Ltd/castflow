'use client'

import { CardNav, type CardNavItem } from './card-nav'

const ITEMS: CardNavItem[] = [
  {
    label: 'For casters',
    bgColor: '#0d1b26',
    textColor: '#ffffff',
    links: [
      { label: 'Why CastFlow for casters', href: '/casters' },
      { label: 'Browse talent', href: '/talent' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Post a shoot', href: '/register?role=caster' },
    ],
  },
  {
    label: 'For artists',
    bgColor: '#2a6b96',
    textColor: '#ffffff',
    links: [
      { label: 'Why CastFlow for artists', href: '/artists' },
      { label: 'Live shoots', href: '/shoots' },
      { label: 'Apply to join', href: '/register?role=artist' },
    ],
  },
  {
    label: 'Platform',
    bgColor: '#85bcda',
    textColor: '#0d1b26',
    links: [
      { label: 'How it works', href: '/how-it-works' },
      { label: 'Trust & safety', href: '/trust' },
      { label: 'Contact sales', href: '/contact' },
    ],
  },
]

export function Nav() {
  return (
    <CardNav
      logo={
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full bg-[#2a6b96]"
            aria-hidden
          />
          CastFlow
        </span>
      }
      items={ITEMS}
      secondary={{ label: 'Log in', href: '/login' }}
      cta={{ label: 'Get started', href: '/register' }}
      baseColor="#ffffff"
      menuColor="#0d1b26"
      buttonBgColor="#0d1b26"
      buttonTextColor="#ffffff"
    />
  )
}
