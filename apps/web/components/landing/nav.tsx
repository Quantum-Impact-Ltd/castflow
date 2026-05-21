'use client'

import { CardNav, type CardNavAction, type CardNavItem } from './card-nav'
import { useAuthSession } from '@/providers/session-provider'
import { useLogout } from '@/lib/hooks/use-auth'
import { postLoginPath } from '@/lib/auth-redirect'

const ITEMS: CardNavItem[] = [
  {
    label: 'For casters',
    bgColor: 'var(--ink-900)',
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
    bgColor: 'var(--brand-700)',
    textColor: '#ffffff',
    links: [
      { label: 'Why CastFlow for artists', href: '/artists' },
      { label: 'Live shoots', href: '/shoots' },
      { label: 'Apply to join', href: '/register?role=artist' },
    ],
  },
  {
    label: 'Platform',
    bgColor: 'var(--brand-300)',
    textColor: 'var(--ink-900)',
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
            className="inline-block h-2 w-2 rounded-full bg-[var(--brand-700)]"
            aria-hidden
          />
          CastFlow
        </span>
      }
      items={ITEMS}
      secondary={secondary}
      cta={cta}
      baseColor="#ffffff"
      menuColor="var(--ink-900)"
      buttonBgColor="var(--ink-900)"
      buttonTextColor="#ffffff"
    />
  )
}
