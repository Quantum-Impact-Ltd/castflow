'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { isNavItemActive, type NavItem } from './nav-config'

interface SidebarNavProps {
  items: NavItem[]
  brand: string
  brandHref: string
  /** Called when a link is tapped — used by the mobile sheet to close itself. */
  onNavigate?: () => void
}

export function SidebarNav({ items, brand, brandHref, onNavigate }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col gap-6 bg-sidebar p-4">
      <Link
        href={brandHref}
        onClick={onNavigate}
        className="px-2 text-lg font-semibold tracking-[-0.02em] text-sidebar-foreground"
      >
        {brand}
      </Link>
      <nav className="flex-1">
        <ul className="space-y-1">
          {items.map((item) => {
            const active = isNavItemActive(item, pathname)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
