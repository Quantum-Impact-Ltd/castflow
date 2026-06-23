import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Search,
  FileText,
  Bookmark,
  Mail,
  CalendarCheck,
  MessageSquare,
  Star,
  UserCircle,
  Bell,
  Settings,
  Briefcase,
  PlusCircle,
  Users,
  BookmarkCheck,
  ClipboardList,
  CreditCard,
  Scale,
  Flag,
  ShieldAlert,
  BarChart3,
  ScrollText,
} from 'lucide-react'

export type DashboardRole = 'artist' | 'caster' | 'admin'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  /** Active when the pathname starts with `href` (for sections with children). */
  matchPrefix?: boolean
}

export const artistNav: NavItem[] = [
  { href: '/artist/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/artist/jobs', label: 'Job Feed', icon: Search, matchPrefix: true },
  { href: '/artist/bids', label: 'My Bids', icon: FileText, matchPrefix: true },
  { href: '/artist/saved', label: 'Saved Jobs', icon: Bookmark },
  { href: '/artist/invites', label: 'Invitations', icon: Mail, matchPrefix: true },
  { href: '/artist/bookings', label: 'Bookings', icon: CalendarCheck, matchPrefix: true },
  { href: '/artist/messages', label: 'Messages', icon: MessageSquare, matchPrefix: true },
  { href: '/artist/reviews', label: 'Reviews', icon: Star },
  { href: '/artist/profile', label: 'My Profile', icon: UserCircle, matchPrefix: true },
  { href: '/artist/notifications', label: 'Notifications', icon: Bell },
  { href: '/artist/settings', label: 'Settings', icon: Settings, matchPrefix: true },
]

export const casterNav: NavItem[] = [
  { href: '/caster/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/caster/jobs', label: 'My Jobs', icon: Briefcase, matchPrefix: true },
  { href: '/caster/jobs/new', label: 'Post a Job', icon: PlusCircle },
  { href: '/caster/talent', label: 'Talent Search', icon: Users },
  { href: '/caster/talent/shortlisted', label: 'Shortlist', icon: BookmarkCheck },
  { href: '/caster/bookings', label: 'Bookings', icon: CalendarCheck, matchPrefix: true },
  { href: '/caster/messages', label: 'Messages', icon: MessageSquare, matchPrefix: true },
  { href: '/caster/settings/billing', label: 'Billing', icon: CreditCard, matchPrefix: true },
  { href: '/caster/notifications', label: 'Notifications', icon: Bell },
  { href: '/caster/settings', label: 'Settings', icon: Settings, matchPrefix: true },
]

export const adminNav: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/applications', label: 'Applications', icon: ClipboardList, matchPrefix: true },
  { href: '/admin/users', label: 'Users', icon: Users, matchPrefix: true },
  { href: '/admin/jobs', label: 'Jobs', icon: Briefcase, matchPrefix: true },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck, matchPrefix: true },
  { href: '/admin/disputes', label: 'Disputes', icon: Scale, matchPrefix: true },
  { href: '/admin/flagged', label: 'Flagged', icon: Flag, matchPrefix: true },
  { href: '/admin/reports', label: 'Reports', icon: ShieldAlert, matchPrefix: true },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/logs', label: 'Audit Log', icon: ScrollText },
]

export const NAVS: Record<DashboardRole, NavItem[]> = {
  artist: artistNav,
  caster: casterNav,
  admin: adminNav,
}

/** Active-state check shared by the sidebar and the mobile sheet. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.matchPrefix) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  }
  return pathname === item.href
}
