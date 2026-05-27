'use client'

import { NAVS, type DashboardRole } from './nav-config'
import { SidebarNav } from './sidebar-nav'
import { Topbar } from './topbar'

interface DashboardShellProps {
  role: DashboardRole
  user: { email: string; role: string }
  children: React.ReactNode
  brand?: string
  brandHref?: string
  notificationsHref?: string
}

const DEFAULT_BRAND: Record<DashboardRole, { brand: string; href: string }> = {
  artist: { brand: 'CastFlow', href: '/artist/dashboard' },
  caster: { brand: 'CastFlow', href: '/caster/dashboard' },
  admin: { brand: 'CastFlow Admin', href: '/admin' },
}

export function DashboardShell({
  role,
  user,
  children,
  brand,
  brandHref,
  notificationsHref,
}: DashboardShellProps) {
  const navItems = NAVS[role]
  const resolvedBrand = brand ?? DEFAULT_BRAND[role].brand
  const resolvedHref = brandHref ?? DEFAULT_BRAND[role].href

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">
        <div className="sticky top-0 h-screen overflow-y-auto">
          <SidebarNav items={navItems} brand={resolvedBrand} brandHref={resolvedHref} />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          navItems={navItems}
          brand={resolvedBrand}
          brandHref={resolvedHref}
          user={user}
          {...(notificationsHref ? { notificationsHref } : {})}
        />
        <main className="flex-1 p-4 lg:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
