'use client'

import { Check, Minus } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { ChartCard } from '@/components/shared/chart-card'
import { DemoOnlyBadge } from '@/components/shared/simulated-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useUsers } from '@/hooks/use-platform-data'
import { PERMISSIONS, ROLE_LABELS } from '@/lib/auth/roles'
import { formatDateTime } from '@/lib/format'
import type { PlatformUser, Role } from '@/lib/types'
import { cn } from '@/lib/utils'

const ROLES: Role[] = ['customer', 'analyst', 'admin']

const STATUS_STYLE: Record<PlatformUser['status'], string> = {
  active: 'bg-success/12 text-success',
  invited: 'bg-cyan/15 text-[oklch(0.45_0.1_220)]',
  suspended: 'bg-destructive/12 text-destructive',
}

export function AdminView() {
  const { data, error, isLoading, mutate } = useUsers()
  const loading = isLoading && !data

  return (
    <>
      <PageHeader
        title="Administration"
        description="Users, roles and permissions. Read-only in this demo: no user changes are saved."
        actions={<DemoOnlyBadge label="Sample users" />}
      />

      <ChartCard
        title="Users"
        description="Sample accounts; in production these come from the identity provider via the backend."
        isLoading={loading}
        error={error}
        onRetry={() => mutate()}
        isEmpty={(data?.length ?? 0) === 0}
        emptyTitle="No users"
        emptyDescription="No user accounts were returned."
        contentClassName="px-0"
      >
        <div className="px-1">
          <Table>
            <caption className="sr-only">Platform users</caption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Email</TableHead>
                <TableHead className="text-xs">Role</TableHead>
                <TableHead className="text-xs">Region</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Last active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((u) => (
                <TableRow key={u.user_id}>
                  <TableCell className="text-sm font-medium text-foreground">{u.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-sm">{ROLE_LABELS[u.role]}</TableCell>
                  <TableCell className="text-sm">{u.region === 'all' ? 'All regions' : u.region}</TableCell>
                  <TableCell>
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', STATUS_STYLE[u.status])}>{u.status}</span>
                  </TableCell>
                  <TableCell className="tabular text-xs whitespace-nowrap text-muted-foreground">
                    {u.last_active ? formatDateTime(u.last_active) : 'Never'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ChartCard>

      <ChartCard
        title="Role permissions"
        description="UI gating used in this demo. The backend must enforce the same rules on every request."
        contentClassName="px-0"
      >
        <div className="px-1">
          <Table>
            <caption className="sr-only">Permissions by role</caption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Permission</TableHead>
                {ROLES.map((r) => (
                  <TableHead key={r} className="text-center text-xs">
                    {ROLE_LABELS[r]}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {PERMISSIONS.map((p) => (
                <TableRow key={p.key}>
                  <TableCell className="text-sm">
                    {p.label} <span className="font-mono text-[11px] text-muted-foreground">{p.key}</span>
                  </TableCell>
                  {ROLES.map((r) => {
                    const allowed = (p.roles as readonly Role[]).includes(r)
                    return (
                      <TableCell key={r} className="text-center">
                        {allowed ? (
                          <Check className="mx-auto size-4 text-success" aria-label="Allowed" />
                        ) : (
                          <Minus className="mx-auto size-4 text-muted-foreground/50" aria-label="Not allowed" />
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ChartCard>
    </>
  )
}
