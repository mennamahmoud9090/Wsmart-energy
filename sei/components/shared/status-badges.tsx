import { SEVERITY_LABELS, STATUS_LABELS } from '@/lib/format'
import type { AlertStatus, Severity, TransformerStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const base = 'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap'

const severityStyles: Record<Severity, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-cyan/15 text-[oklch(0.45_0.1_220)]',
  high: 'bg-warning/20 text-warning-foreground',
  critical: 'bg-destructive/12 text-destructive',
}

const severityDot: Record<Severity, string> = {
  low: 'bg-muted-foreground/60',
  medium: 'bg-cyan',
  high: 'bg-warning',
  critical: 'bg-destructive',
}

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span className={cn(base, severityStyles[severity], className)}>
      <span className={cn('size-1.5 rounded-full', severityDot[severity])} aria-hidden="true" />
      {SEVERITY_LABELS[severity]}
    </span>
  )
}

const statusStyles: Record<AlertStatus, string> = {
  open: 'border border-destructive/30 text-destructive bg-card',
  investigating: 'border border-warning/50 text-warning-foreground bg-card',
  resolved: 'border border-success/40 text-success bg-card',
  dismissed: 'border border-border text-muted-foreground bg-card',
}

export function AlertStatusBadge({ status, className }: { status: AlertStatus; className?: string }) {
  return <span className={cn(base, statusStyles[status], className)}>{STATUS_LABELS[status]}</span>
}

const transformerStyles: Record<TransformerStatus, string> = {
  normal: 'bg-success/12 text-success',
  warning: 'bg-warning/20 text-warning-foreground',
  overloaded: 'bg-destructive/12 text-destructive',
}

const transformerLabels: Record<TransformerStatus, string> = {
  normal: 'Normal',
  warning: 'Near limit',
  overloaded: 'Overloaded',
}

export function TransformerStatusBadge({ status, className }: { status: TransformerStatus; className?: string }) {
  return <span className={cn(base, transformerStyles[status], className)}>{transformerLabels[status]}</span>
}
