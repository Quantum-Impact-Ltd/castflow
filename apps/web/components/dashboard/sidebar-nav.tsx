'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { NavItem } from './nav-config'

interface SidebarNavProps {
  items: NavItem[]
  brand: string
  brandHref: string
}

function isActive(href: string, matchPrefix: boolean | undefined, pathname: string): boolean {
  if (pathname === href) return true
  if (matchPrefix && pathname.startsWith(`${href}/`)) return true
  return false
}

export function SidebarNav({ items, brand, brandHref }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex h-full flex-col gap-1 p-4">
      <Link
        href={brandHref}
        className="mb-4 flex h-10 items-center px-2 text-lg font-semibold tracking-tight"
      >
        {brand}
      </Link>
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => {
          const active = isActive(item.href, item.matchPrefix, pathname)
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
