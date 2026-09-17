import {
  Home,
  CalendarDays,
  Activity,
  FolderOpen,
  MessageCircle,
  ListChecks,
  Users,
  Wallet,
  MoreHorizontal,
  LayoutDashboard,
  Stethoscope,
  CreditCard,
  MessageSquareText,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  /** Key under messages.nav.<role>.<key> */
  key: string;
  icon: LucideIcon;
}

export const clientNav: NavItem[] = [
  { href: '/app', key: 'home', icon: Home },
  { href: '/app/sessions', key: 'sessions', icon: CalendarDays },
  { href: '/app/track', key: 'track', icon: Activity },
  { href: '/app/files', key: 'files', icon: FolderOpen },
  { href: '/app/messages', key: 'messages', icon: MessageCircle },
];

export const providerNav: NavItem[] = [
  { href: '/pro', key: 'today', icon: ListChecks },
  { href: '/pro/calendar', key: 'calendar', icon: CalendarDays },
  { href: '/pro/patients', key: 'patients', icon: Users },
  { href: '/pro/earnings', key: 'earnings', icon: Wallet },
  { href: '/pro/more', key: 'more', icon: MoreHorizontal },
];

export const adminNav: NavItem[] = [
  { href: '/admin', key: 'dashboard', icon: LayoutDashboard },
  { href: '/admin/providers', key: 'providers', icon: Stethoscope },
  { href: '/admin/clients', key: 'clients', icon: Users },
  { href: '/admin/payments', key: 'payments', icon: CreditCard },
  { href: '/admin/follow-ups', key: 'followUps', icon: MessageSquareText },
  { href: '/admin/settings', key: 'settings', icon: Settings },
];

/* NavRole -> (items, i18n namespace). Client Components (SidebarNav,
 * BottomTabBar) look this up internally, keyed by a plain string prop, so
 * that lucide icon *component references* never have to cross the
 * Server -> Client prop boundary (React Server Components cannot
 * serialize a function passed as a plain prop value — only shells doing
 * the importing, not the shells passing icons down, is what makes this
 * safe). */
export type NavRole = 'client' | 'provider' | 'admin';

export const NAV_BY_ROLE: Record<NavRole, { items: NavItem[]; namespace: string }> = {
  client: { items: clientNav, namespace: 'nav.client' },
  provider: { items: providerNav, namespace: 'nav.provider' },
  admin: { items: adminNav, namespace: 'nav.admin' },
};
