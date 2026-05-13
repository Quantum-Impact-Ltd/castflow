'use client'

import { SidebarNav } from './sidebar-nav'
import { Topbar } from './topbar'
import { adminNav, artistNav, casterNav, type NavItem } from './nav-config'

type Role = 'artist' | 'caster' | 'admin'

interface DashboardShellProps {
  role: Role
  brand: string
  brandHref: string
  user: { email: string; role: string }
  notificationsHref?: string
  children: React.ReactNode
}

const NAVS: Record<Role, NavItem[]> = {
  artist: artistNav,
  caster: casterNav,
  admin: adminNav,
}

export function DashboardShell({
  role,
  brand,
  brandHref,
  user,
  notificationsHref,
  children,
}: DashboardShellProps) {
  const items = NAVS[role]
  return (
    <div className="bg-background min-h-screen">
      <aside className="border-border bg-card fixed inset-y-0 left-0 z-30 hidden w-64 border-r lg:flex lg:flex-col">
        <SidebarNav items={items} brand={brand} brandHref={brandHref} />
      </aside>
      <div className="flex min-h-screen flex-col lg:ml-64">
        <Topbar
          items={items}
          brand={brand}
          brandHref={brandHref}
          user={user}
          notificationsHref={notificationsHref}
        />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
