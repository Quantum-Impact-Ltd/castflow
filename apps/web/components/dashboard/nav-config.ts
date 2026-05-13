import {
  LayoutDashboard,
  User,
  Image,
  Briefcase,
  ListChecks,
  Calendar,
  PoundSterling,
  MessageSquare,
  Star,
  Bell,
  Settings,
  Users,
  ClipboardList,
  CreditCard,
  ShieldAlert,
  ScrollText,
  BarChart3,
  Search,
  Flag,
} from 'lucide-react'
import type { ComponentType } from 'react'

export interface NavItem {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
  matchPrefix?: boolean
}

export const artistNav: NavItem[] = [
  { href: '/artist/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/artist/jobs', label: 'Find Jobs', icon: Briefcase, matchPrefix: true },
  { href: '/artist/bids', label: 'My Bids', icon: ListChecks, matchPrefix: true },
  { href: '/artist/bookings', label: 'Bookings', icon: Calendar, matchPrefix: true },
  { href: '/artist/earnings', label: 'Earnings', icon: PoundSterling, matchPrefix: true },
  { href: '/artist/messages', label: 'Messages', icon: MessageSquare, matchPrefix: true },
  { href: '/artist/reviews', label: 'Reviews', icon: Star },
  { href: '/artist/profile', label: 'Profile', icon: User, matchPrefix: true },
  { href: '/artist/portfolio', label: 'Portfolio', icon: Image },
  { href: '/artist/notifications', label: 'Notifications', icon: Bell },
  { href: '/artist/settings', label: 'Settings', icon: Settings, matchPrefix: true },
]

export const casterNav: NavItem[] = [
  { href: '/caster/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/caster/jobs', label: 'My Jobs', icon: Briefcase, matchPrefix: true },
  { href: '/caster/talent', label: 'Find Talent', icon: Search, matchPrefix: true },
  { href: '/caster/bookings', label: 'Bookings', icon: Calendar, matchPrefix: true },
  { href: '/caster/messages', label: 'Messages', icon: MessageSquare, matchPrefix: true },
  { href: '/caster/settings', label: 'Settings', icon: Settings, matchPrefix: true },
]

export const adminNav: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/applications', label: 'Applications', icon: ClipboardList, matchPrefix: true },
  { href: '/admin/users', label: 'Users', icon: Users, matchPrefix: true },
  { href: '/admin/jobs', label: 'Jobs', icon: Briefcase, matchPrefix: true },
  { href: '/admin/bookings', label: 'Bookings', icon: Calendar, matchPrefix: true },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard, matchPrefix: true },
  { href: '/admin/disputes', label: 'Disputes', icon: ShieldAlert, matchPrefix: true },
  { href: '/admin/flagged', label: 'Flagged', icon: Flag, matchPrefix: true },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/logs', label: 'Audit Log', icon: ScrollText },
]
