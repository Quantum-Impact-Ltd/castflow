'use client'

import { CardNav, type CardNavAction, type CardNavItem } from './card-nav'
import { useAuthSession } from '@/providers/session-provider'
import { useLogout } from '@/lib/hooks/use-auth'
import { postLoginPath } from '@/lib/auth-redirect'

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
  // useAuthSession is populated immediately from the server-rendered session,
  // so first paint already shows the correct CTA for logged-in users.
  const { session } = useAuthSession()
  const logoutMutation = useLogout()

  let secondary: CardNavAction = { label: 'Log in', href: '/login' }
  let cta: CardNavAction = { label: 'Get started', href: '/register' }

  if (session?.user) {
    const user = session.user
    const dashboardHref = postLoginPath({
      role: user.role,
      approvalStatus: user.approvalStatus ?? null,
    })
    secondary = {
      label: 'Log out',
      onClick: () => {
        logoutMutation.mutate(undefined, {
          onSuccess: () => {
            // Hard navigation to root so Server Components re-fetch session.
            // router.push alone keeps stale RSC payloads cached.
            window.location.href = '/'
          },
        })
      },
    }
    cta = { label: 'Dashboard', href: dashboardHref }
  }

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
      secondary={secondary}
      cta={cta}
      baseColor="#ffffff"
      menuColor="#0d1b26"
      buttonBgColor="#0d1b26"
      buttonTextColor="#ffffff"
    />
  )
}
