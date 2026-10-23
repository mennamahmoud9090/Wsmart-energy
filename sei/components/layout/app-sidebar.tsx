'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  FileBarChart,
  Gauge,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
  ShieldCheck,
  UtilityPole,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { navForRole, ROLE_LABELS, type NavIcon, type NavItem } from '@/lib/auth/roles'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/utils'

const ICONS: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  usage: Gauge,
  consumption: Activity,
  grid: UtilityPole,
  anomalies: ShieldAlert,
  reports: FileBarChart,
  system: Workflow,
  admin: ShieldCheck,
}

const GROUP_ORDER: NavItem['group'][] = ['Analytics', 'Insights', 'Platform']

export function SidebarNav({
  role,
  collapsed = false,
  onNavigate,
}: {
  role: Role
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const items = navForRole(role)

  return (
    <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
      {GROUP_ORDER.map((group) => {
        const groupItems = items.filter((item) => item.group === group)
        if (groupItems.length === 0) return null
        return (
          <div key={group} className="flex flex-col gap-1">
            {collapsed ? (
              <div className="mx-2 mb-1 h-px bg-sidebar-border" aria-hidden="true" />
            ) : (
              <p className="px-3 pb-1 text-[11px] font-medium tracking-wider text-sidebar-foreground/50 uppercase">
                {group}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {groupItems.map((item) => {
                const Icon = ICONS[item.icon]
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                const link = (
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                      'focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none',
                      active
                        ? 'bg-sidebar-accent text-white'
                        : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-white',
                      collapsed && 'justify-center px-0',
                    )}
                  >
                    <Icon
                      className={cn('size-4 shrink-0', active ? 'text-cyan' : 'text-sidebar-foreground/60 group-hover:text-cyan')}
                      aria-hidden="true"
                    />
                    {collapsed ? <span className="sr-only">{item.label}</span> : <span className="truncate">{item.label}</span>}
                  </Link>
                )
                return (
                  <li key={item.href}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger render={link} />
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}

function SidebarFooter({ role, collapsed }: { role: Role; collapsed: boolean }) {
  if (collapsed) return null
  return (
    <div className="mx-3 mb-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
      <p className="text-xs font-medium text-white">Viewing as {ROLE_LABELS[role]}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-sidebar-foreground/65">
        Role-based navigation is demo-only. Access is not enforced until backend authorization is implemented.
      </p>
    </div>
  )
}

export function AppSidebar({
  role,
  collapsed,
  onToggle,
}: {
  role: Role
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex',
        collapsed ? 'w-[72px]' : 'w-64',
      )}
    >
      <div className={cn('flex h-16 items-center border-b border-sidebar-border px-4', collapsed && 'justify-center px-0')}>
        <Link href="/" aria-label="Smart Energy Intelligence Platform home">
          <Logo collapsed={collapsed} inverted />
        </Link>
      </div>
      <SidebarNav role={role} collapsed={collapsed} />
      <SidebarFooter role={role} collapsed={collapsed} />
      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className={cn(
            'flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-white focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? <PanelLeftOpen className="size-4" aria-hidden="true" /> : <PanelLeftClose className="size-4" aria-hidden="true" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
