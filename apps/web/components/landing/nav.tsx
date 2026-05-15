'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const NAV_LINKS = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/casters', label: 'For casters' },
  { href: '/artists', label: 'For artists' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/trust', label: 'Trust' },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full',
        'animate-in slide-in-from-top-3 fade-in duration-700 fill-mode-both',
        'transition-[background,border,backdrop-filter] duration-200',
        scrolled
          ? 'border-b border-border/60 bg-background/85 backdrop-blur-md'
          : 'border-b border-transparent bg-background/0',
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center justify-between px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2 text-lg font-medium tracking-tight text-foreground"
        >
          <span
            className="inline-block h-2 w-2 rounded-full bg-primary transition-transform duration-500 group-hover:scale-150"
            aria-hidden
          />
          CastFlow
        </Link>

        <nav className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'relative text-sm font-medium text-foreground/75 transition-colors hover:text-foreground',
                "after:absolute after:-bottom-1.5 after:left-0 after:h-[2px] after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm" className="font-medium">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full">
            <Link href="/register">Get started</Link>
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-sm p-6">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="flex h-full flex-col">
              <Link
                href="/"
                className="text-lg font-medium tracking-tight"
              >
                CastFlow
              </Link>
              <nav className="mt-8 flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-md px-2 py-3 text-base text-foreground transition-colors hover:bg-accent"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 pt-6">
                <Button asChild variant="outline" size="lg">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="lg" className="rounded-full">
                  <Link href="/register">Get started</Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
