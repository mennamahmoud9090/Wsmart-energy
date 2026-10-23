/**
 * Role model used for navigation and UI gating. DEMO-ONLY: this controls what
 * the interface shows, not what data a user may access. Real authorization
 * must be enforced by the backend on every request.
 */
import type { Role } from '@/lib/types'

export const ROLE_LABELS: Record<Role, string> = {
  customer: 'Customer',
  analyst: 'Energy Analyst',
  admin: 'Administrator',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  customer: 'Views own meter consumption and basic reports.',
  analyst: 'Explores consumption, grid performance, and anomalies.',
  admin: 'Manages users, permissions, and system settings.',
}

export type NavIcon =
  | 'dashboard'
  | 'usage'
  | 'consumption'
  | 'grid'
  | 'anomalies'
  | 'reports'
  | 'system'
  | 'admin'

export interface NavItem {
  href: string
  label: string
  icon: NavIcon
  roles: Role[]
  group: 'Analytics' | 'Insights' | 'Platform'
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['analyst', 'admin'], group: 'Analytics' },
  { href: '/my-usage', label: 'My Usage', icon: 'usage', roles: ['customer'], group: 'Analytics' },
  { href: '/consumption', label: 'Energy Consumption', icon: 'consumption', roles: ['analyst', 'admin'], group: 'Analytics' },
  { href: '/grid', label: 'Grid & Transformers', icon: 'grid', roles: ['analyst', 'admin'], group: 'Analytics' },
  { href: '/anomalies', label: 'Anomaly Detection', icon: 'anomalies', roles: ['analyst', 'admin'], group: 'Insights' },
  { href: '/reports', label: 'Reports', icon: 'reports', roles: ['customer', 'analyst', 'admin'], group: 'Insights' },
  { href: '/system', label: 'System Overview', icon: 'system', roles: ['analyst', 'admin'], group: 'Platform' },
  { href: '/admin', label: 'Administration', icon: 'admin', roles: ['admin'], group: 'Platform' },
]

export const PERMISSIONS = [
  { key: 'usage.own.read', label: 'View own meter usage', roles: ['customer', 'analyst', 'admin'] },
  { key: 'reports.basic.read', label: 'View basic reports', roles: ['customer', 'analyst', 'admin'] },
  { key: 'consumption.fleet.read', label: 'Explore fleet consumption', roles: ['analyst', 'admin'] },
  { key: 'grid.read', label: 'View grid & transformer analytics', roles: ['analyst', 'admin'] },
  { key: 'anomalies.read', label: 'View anomaly alerts', roles: ['analyst', 'admin'] },
  { key: 'anomalies.update', label: 'Update alert status', roles: ['analyst', 'admin'] },
  { key: 'reports.advanced.read', label: 'View advanced Power BI reports', roles: ['analyst', 'admin'] },
  { key: 'users.manage', label: 'Manage users & roles', roles: ['admin'] },
  { key: 'settings.manage', label: 'Manage system settings', roles: ['admin'] },
] as const satisfies readonly { key: string; label: string; roles: Role[] }[]

export type PermissionKey = (typeof PERMISSIONS)[number]['key']

export function hasPermission(role: Role, permission: PermissionKey) {
  return (PERMISSIONS.find((p) => p.key === permission)?.roles as readonly Role[] | undefined)?.includes(role) ?? false
}

export function navForRole(role: Role) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}

export function homeForRole(role: Role) {
  return role === 'customer' ? '/my-usage' : '/dashboard'
}

export function canAccessPath(role: Role, pathname: string) {
  const item = NAV_ITEMS.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`))
  return item ? item.roles.includes(role) : true
}
