'use client'

import { ChevronRight, FlaskConical, Radar, ShieldAlert, TrendingDown, Zap, type LucideIcon } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertStatusBadge, SeverityBadge } from '@/components/shared/status-badges'
import { ANOMALY_LABELS, formatDateTime, formatNumber } from '@/lib/format'
import type { Alert, AnomalyType } from '@/lib/types'
import { cn } from '@/lib/utils'

export const ANOMALY_META: Record<AnomalyType, { icon: LucideIcon; color: string }> = {
  transformer_load_surge: { icon: Zap, color: 'var(--chart-1)' },
  persistent_voltage_drop: { icon: TrendingDown, color: 'var(--chart-2)' },
  irregular_consumption_pattern: { icon: ShieldAlert, color: 'var(--chart-3)' },
}

export function AnomalyTypeLabel({ type, className }: { type: AnomalyType; className?: string }) {
  const { icon: Icon, color } = ANOMALY_META[type]
  return (
    <span className={cn('inline-flex items-center gap-2 whitespace-nowrap', className)}>
      <Icon className="size-3.5 shrink-0" style={{ color }} aria-hidden="true" />
      {ANOMALY_LABELS[type]}
    </span>
  )
}

export function OriginBadge({ origin }: { origin: Alert['origin'] }) {
  const simulated = origin === 'simulated'
  const Icon = simulated ? FlaskConical : Radar
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        simulated ? 'border-warning/40 bg-warning/10 text-warning-foreground' : 'border-teal/40 bg-teal/10 text-teal',
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {simulated ? 'Simulated' : 'Detected'}
    </span>
  )
}

export function AlertsTable({
  alerts,
  onSelect,
  compact = false,
  caption,
}: {
  alerts: Alert[]
  onSelect: (alert: Alert) => void
  compact?: boolean
  caption: string
}) {
  return (
    <Table>
      <caption className="sr-only">{caption}</caption>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-xs">Alert ID</TableHead>
          <TableHead className="text-xs">Meter ID</TableHead>
          {!compact && <TableHead className="text-xs">Location</TableHead>}
          <TableHead className="text-xs">Timestamp</TableHead>
          <TableHead className="text-xs">Anomaly type</TableHead>
          <TableHead className="text-xs">Severity</TableHead>
          <TableHead className="text-right text-xs">Observed value</TableHead>
          <TableHead className="text-xs">Status</TableHead>
          <TableHead className="text-xs">Source</TableHead>
          <TableHead className="w-8">
            <span className="sr-only">Details</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {alerts.map((alert) => (
          <TableRow
            key={alert.alert_id}
            className="cursor-pointer"
            onClick={() => onSelect(alert)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(alert)
              }
            }}
            tabIndex={0}
            aria-label={`Open details for alert ${alert.alert_id}`}
          >
            <TableCell className="font-mono text-xs font-medium text-foreground">{alert.alert_id}</TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">{alert.meter_id}</TableCell>
            {!compact && (
              <TableCell className="text-sm">
                <span className="block text-foreground">{alert.location}</span>
                <span className="block text-xs text-muted-foreground">{alert.region} region</span>
              </TableCell>
            )}
            <TableCell className="tabular text-xs whitespace-nowrap text-muted-foreground">{formatDateTime(alert.timestamp)}</TableCell>
            <TableCell className="text-sm">
              <AnomalyTypeLabel type={alert.anomaly_type} />
            </TableCell>
            <TableCell>
              <SeverityBadge severity={alert.severity} />
            </TableCell>
            <TableCell className="tabular text-right text-sm whitespace-nowrap">
              <span className="font-medium text-foreground">{formatNumber(alert.observed_value, 1)}</span>{' '}
              <span className="text-xs text-muted-foreground">{alert.unit}</span>
            </TableCell>
            <TableCell>
              <AlertStatusBadge status={alert.status} />
            </TableCell>
            <TableCell>
              <OriginBadge origin={alert.origin} />
            </TableCell>
            <TableCell>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
