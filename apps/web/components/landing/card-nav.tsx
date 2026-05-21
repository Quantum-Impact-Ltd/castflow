'use client'

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { gsap } from 'gsap'
import './card-nav.css'

export interface CardNavLink {
  label: string
  href: string
  ariaLabel?: string
}

export interface CardNavItem {
  label: string
  bgColor: string
  textColor: string
  links: CardNavLink[]
}

export interface CardNavAction {
  label: string
  /** Render as a Link if set; ignored when `onClick` is provided. */
  href?: string
  /** Render as a button if set — used for actions like logout that can't be a link. */
  onClick?: () => void
}

export interface CardNavProps {
  logo: ReactNode
  items: CardNavItem[]
  cta?: CardNavAction
  /** Ghost-style action shown to the left of the primary CTA on desktop (e.g. Log in). */
  secondary?: CardNavAction
  className?: string
  ease?: string
  baseColor?: string
  menuColor?: string
  buttonBgColor?: string
  buttonTextColor?: string
}

export function CardNav({
  logo,
  items,
  cta,
  secondary,
  className = '',
  ease = 'power3.out',
  baseColor = '#fff',
  menuColor,
  buttonBgColor,
  buttonTextColor,
}: CardNavProps) {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const navRef = useRef<HTMLElement | null>(null)
  const cardsRef = useRef<Array<HTMLDivElement | null>>([])
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  const calculateHeight = (): number => {
    const navEl = navRef.current
    if (!navEl) return 260

    const isMobile = window.matchMedia('(max-width: 768px)').matches
    if (isMobile) {
      const contentEl = navEl.querySelector<HTMLDivElement>('.card-nav-content')
      if (contentEl) {
        const wasVisible = contentEl.style.visibility
        const wasPointerEvents = contentEl.style.pointerEvents
        const wasPosition = contentEl.style.position
        const wasHeight = contentEl.style.height

        contentEl.style.visibility = 'visible'
        contentEl.style.pointerEvents = 'auto'
        contentEl.style.position = 'static'
        contentEl.style.height = 'auto'

        // Force reflow so scrollHeight is accurate
        void contentEl.offsetHeight

        const topBar = 60
        const padding = 16
        const contentHeight = contentEl.scrollHeight

        contentEl.style.visibility = wasVisible
        contentEl.style.pointerEvents = wasPointerEvents
        contentEl.style.position = wasPosition
        contentEl.style.height = wasHeight

        return topBar + contentHeight + padding
      }
    }
    return 260
  }

  const createTimeline = (): gsap.core.Timeline | null => {
    const navEl = navRef.current
    if (!navEl) return null

    gsap.set(navEl, { height: 60, overflow: 'hidden' })
    gsap.set(cardsRef.current, { y: 50, opacity: 0 })

    const tl = gsap.timeline({ paused: true })

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.4,
      ease,
    })

    tl.to(
      cardsRef.current,
      { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 },
      '-=0.1',
    )

    return tl
  }

  useLayoutEffect(() => {
    const tl = createTimeline()
    tlRef.current = tl

    return () => {
      tl?.kill()
      tlRef.current = null
    }
  }, [ease, items])

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return

      if (isExpanded) {
        const newHeight = calculateHeight()
        gsap.set(navRef.current, { height: newHeight })

        tlRef.current.kill()
        const newTl = createTimeline()
        if (newTl) {
          newTl.progress(1)
          tlRef.current = newTl
        }
      } else {
        tlRef.current.kill()
        const newTl = createTimeline()
        if (newTl) {
          tlRef.current = newTl
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isExpanded])

  const toggleMenu = () => {
    const tl = tlRef.current
    if (!tl) return
    if (!isExpanded) {
      setIsHamburgerOpen(true)
      setIsExpanded(true)
      tl.play(0)
    } else {
      setIsHamburgerOpen(false)
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false))
      tl.reverse()
    }
  }

  const closeMenu = () => {
    const tl = tlRef.current
    if (!tl || !isExpanded) return
    setIsHamburgerOpen(false)
    tl.eventCallback('onReverseComplete', () => setIsExpanded(false))
    tl.reverse()
  }

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    cardsRef.current[i] = el
  }

  return (
    <div className={`card-nav-container ${className}`}>
      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? 'open' : ''}`}
        style={{ backgroundColor: baseColor }}
      >
        <div className="card-nav-top">
          <button
            type="button"
            className={`hamburger-menu ${isHamburgerOpen ? 'open' : ''}`}
            onClick={toggleMenu}
            aria-label={isExpanded ? 'Close menu' : 'Open menu'}
            aria-expanded={isExpanded}
            style={{ color: menuColor ?? '#0d1b26' }}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </button>

          <Link
            href="/"
            className="logo-container"
            style={{ color: menuColor ?? '#0d1b26', textDecoration: 'none' }}
            onClick={closeMenu}
          >
            {logo}
          </Link>

          <div className="card-nav-actions">
            {secondary ? (
              secondary.onClick ? (
                <button
                  type="button"
                  className="card-nav-secondary"
                  style={{ color: menuColor ?? '#0d1b26', background: 'none', border: 0 }}
                  onClick={() => {
                    closeMenu()
                    secondary.onClick?.()
                  }}
                >
                  {secondary.label}
                </button>
              ) : (
                <Link
                  href={secondary.href ?? '#'}
                  className="card-nav-secondary"
                  style={{ color: menuColor ?? '#0d1b26' }}
                  onClick={closeMenu}
                >
                  {secondary.label}
                </Link>
              )
            ) : null}
            {cta ? (
              cta.onClick ? (
                <button
                  type="button"
                  className="card-nav-cta-button"
                  style={{
                    ...(buttonBgColor ? { backgroundColor: buttonBgColor } : {}),
                    ...(buttonTextColor ? { color: buttonTextColor } : {}),
                  }}
                  onClick={() => {
                    closeMenu()
                    cta.onClick?.()
                  }}
                >
                  {cta.label}
                </button>
              ) : (
                <Link
                  href={cta.href ?? '#'}
                  className="card-nav-cta-button"
                  style={{
                    ...(buttonBgColor ? { backgroundColor: buttonBgColor } : {}),
                    ...(buttonTextColor ? { color: buttonTextColor } : {}),
                  }}
                  onClick={closeMenu}
                >
                  {cta.label}
                </Link>
              )
            ) : null}
          </div>
        </div>

        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {items.slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card"
              ref={setCardRef(idx)}
              style={{ backgroundColor: item.bgColor, color: item.textColor }}
            >
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                {item.links.map((lnk, i) => (
                  <Link
                    key={`${lnk.label}-${i}`}
                    href={lnk.href}
                    className="nav-card-link"
                    aria-label={lnk.ariaLabel ?? lnk.label}
                    onClick={closeMenu}
                  >
                    <ArrowUpRight className="nav-card-link-icon" aria-hidden />
                    {lnk.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  )
}
