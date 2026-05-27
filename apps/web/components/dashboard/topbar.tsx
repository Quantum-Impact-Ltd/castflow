'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, LogOut, Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/lib/hooks/use-auth'
import { useNotifications } from '@/lib/hooks/use-notifications'
import { cn } from '@/lib/utils'
import { SidebarNav } from './sidebar-nav'
import type { NavItem } from './nav-config'

interface TopbarProps {
  navItems: NavItem[]
  brand: string
  brandHref: string
  user: { email: string; role: string }
  notificationsHref?: string
}

export function Topbar({ navItems, brand, brandHref, user, notificationsHref }: TopbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const logout = useLogout()
  const { data: unread } = useNotifications({ unreadOnly: true, limit: 50 })
  const unreadCount = unread?.length ?? 0

  const initials = user.email.slice(0, 2).toUpperCase()

  function handleSignOut() {
    logout.mutate(undefined, {
      onSettled: () => {
        window.location.href = '/'
      },
    })
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur lg:px-8">
      {/* Mobile nav trigger */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav
            items={navItems}
            brand={brand}
            brandHref={brandHref}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="lg:hidden">
        <Link href={brandHref} className="font-semibold tracking-[-0.02em]">
          {brand}
        </Link>
      </div>

      <div className="ml-auto flex items-center gap-1">
        {notificationsHref ? (
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="relative"
            aria-label="Notifications"
          >
            <Link href={notificationsHref}>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span
                  className={cn(
                    'absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground'
                  )}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </Link>
          </Button>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 rounded-full p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Account menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="truncate text-sm font-medium">{user.email}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {user.role}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSignOut} disabled={logout.isPending}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
