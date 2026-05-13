'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, LogOut, Menu, User as UserIcon } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarNav } from './sidebar-nav'
import type { NavItem } from './nav-config'

interface TopbarProps {
  items: NavItem[]
  brand: string
  brandHref: string
  user: { email: string; role: string }
  notificationsHref?: string
}

export function Topbar({ items, brand, brandHref, user, notificationsHref }: TopbarProps) {
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="border-border bg-background sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="size-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <SidebarNav items={items} brand={brand} brandHref={brandHref} />
          </SheetContent>
        </Sheet>
        <Link href={brandHref} className="text-base font-semibold lg:hidden">
          {brand}
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {notificationsHref ? (
          <Button asChild variant="ghost" size="icon" aria-label="Notifications">
            <Link href={notificationsHref}>
              <Bell className="size-5" />
            </Link>
          </Button>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Account menu">
              <UserIcon className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{user.email}</span>
              <span className="text-muted-foreground text-xs capitalize">{user.role}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleSignOut}>
              <LogOut className="mr-2 size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
