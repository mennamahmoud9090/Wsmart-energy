'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { Logo } from '@/components/brand/logo'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { canAccessPath, homeForRole, NAV_ITEMS, ROLE_LABELS } from '@/lib/auth/roles'
import { AppSidebar, SidebarNav } from './app-sidebar'
import { TopBar } from './top-bar'

function ShellSkeleton() {
  return (
    <div className="flex min-h-svh" role="status" aria-label="Loading workspace">
      <div className="hidden w-64 bg-sidebar lg:block" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Skeleton className="h-8 w-60" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    </div>
  )
}

function RestrictedNotice({ home }: { home: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center shadow-xs">
      <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Lock className="size-5" aria-hidden="true" />
      </span>
      <h1 className="text-base font-semibold text-foreground">This area isn&apos;t available for your role</h1>
      <p className="text-sm text-muted-foreground">
        This is a demo-only restriction applied in the interface. Real access control will be enforced by the backend
        once authorization is implemented.
      </p>
      <Button render={<Link href={home} />} className="mt-1">
        Go to my home page
      </Button>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { status, session } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.replace(`/login?next=${encodeURIComponent(pathname)}`)
  }, [status, router, pathname])

  if (status !== 'authenticated' || !session) return <ShellSkeleton />

  const current = NAV_ITEMS.find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`))
  const allowed = canAccessPath(session.role, pathname)

  return (
    <div className="flex min-h-svh bg-background">
      <AppSidebar role={session.role} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
          <div className="flex h-16 items-center border-b border-sidebar-border px-4">
            <Logo inverted />
          </div>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Navigation for {ROLE_LABELS[session.role]} role (demo only)
          </SheetDescription>
          <SidebarNav role={session.role} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={current?.label ?? 'Overview'} onOpenMobileNav={() => setMobileOpen(true)} />
        <main id="main" className="flex-1 px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6">
            {allowed ? children : <RestrictedNotice home={homeForRole(session.role)} />}
          </div>
        </main>
        <footer className="border-t border-border px-4 py-4 text-xs text-muted-foreground md:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-1 sm:flex-row sm:justify-between">
            <p>Smart Energy Intelligence Platform · Big Data Engineering graduation project</p>
            <p>All figures are simulated and do not represent real electricity measurements.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
