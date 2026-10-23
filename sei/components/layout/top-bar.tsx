'use client'

import { useRouter } from 'next/navigation'
import { Check, ChevronDown, Database, FlaskConical, LogOut, Menu, UserCog } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { useDemoState } from '@/components/providers/demo-state-provider'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DemoDataState } from '@/lib/api/energy-service'
import { homeForRole, ROLE_LABELS } from '@/lib/auth/roles'
import { appConfig } from '@/lib/config'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/utils'

const DATA_STATES: { value: DemoDataState; label: string; hint: string }[] = [
  { value: 'normal', label: 'Normal', hint: 'Typical response time' },
  { value: 'slow', label: 'Slow network', hint: 'Shows loading states' },
  { value: 'empty', label: 'Empty result', hint: 'Shows empty states' },
  { value: 'error', label: 'Service error', hint: 'Shows error states' },
]

const ROLES: Role[] = ['customer', 'analyst', 'admin']

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function DataSourceIndicator() {
  const { dataState, setDataState } = useDemoState()
  const isMock = appConfig.dataSource === 'mock'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2 bg-card">
            <span className={cn('size-2 rounded-full', isMock ? 'bg-warning' : 'bg-success')} aria-hidden="true" />
            <span className="hidden sm:inline">{isMock ? 'Simulated data' : 'API mode'}</span>
            <span className="sm:hidden">{isMock ? 'Demo' : 'API'}</span>
            {dataState !== 'normal' && (
              <span className="rounded bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">{dataState}</span>
            )}
            <ChevronDown className="text-muted-foreground" aria-hidden="true" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-start gap-2 py-2">
            {isMock ? (
              <FlaskConical className="mt-0.5 size-4 text-warning-foreground" aria-hidden="true" />
            ) : (
              <Database className="mt-0.5 size-4 text-success" aria-hidden="true" />
            )}
            <span className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-foreground">
                {isMock ? 'Synthetic data generator' : 'Backend API'}
              </span>
              <span className="text-[11px] font-normal leading-relaxed text-muted-foreground">
                {isMock
                  ? 'All values are simulated in the browser. No backend or warehouse is connected.'
                  : `Requests go to ${appConfig.apiBaseUrl || '(NEXT_PUBLIC_API_BASE_URL not set)'}`}
              </span>
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        {isMock && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[11px] tracking-wide uppercase">Demo response mode</DropdownMenuLabel>
              {DATA_STATES.map((state) => (
                <DropdownMenuItem key={state.value} onClick={() => setDataState(state.value)}>
                  <span className="flex flex-1 flex-col">
                    <span>{state.label}</span>
                    <span className="text-[11px] text-muted-foreground">{state.hint}</span>
                  </span>
                  {dataState === state.value && <Check className="text-teal" aria-hidden="true" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UserMenu() {
  const { session, signOut, switchRole } = useAuth()
  const router = useRouter()
  if (!session) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                {initials(session.name)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden min-w-0 text-left leading-tight md:block">
              <span className="block max-w-36 truncate text-sm font-medium text-foreground">{session.name}</span>
              <span className="block text-xs text-muted-foreground">{ROLE_LABELS[session.role]}</span>
            </span>
            <ChevronDown className="hidden size-4 text-muted-foreground md:block" aria-hidden="true" />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
            <span className="text-sm font-medium text-foreground">{session.name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">{session.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-1.5 text-[11px] tracking-wide uppercase">
            <UserCog className="size-3.5" aria-hidden="true" />
            Switch demo role
          </DropdownMenuLabel>
          {ROLES.map((role) => (
            <DropdownMenuItem
              key={role}
              onClick={() => {
                switchRole(role)
                router.push(homeForRole(role))
              }}
            >
              <span className="flex-1">{ROLE_LABELS[role]}</span>
              {session.role === role && <Check className="text-teal" aria-hidden="true" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            signOut()
            router.replace('/login')
          }}
        >
          <LogOut aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TopBar({ title, onOpenMobileNav }: { title: string; onOpenMobileNav: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobileNav} aria-label="Open navigation">
        <Menu aria-hidden="true" />
      </Button>
      <p className="min-w-0 truncate text-sm font-medium text-muted-foreground">
        <span className="hidden sm:inline">Smart Energy Intelligence / </span>
        <span className="text-foreground">{title}</span>
      </p>
      <div className="ml-auto flex items-center gap-2">
        <DataSourceIndicator />
        <UserMenu />
      </div>
    </header>
  )
}
