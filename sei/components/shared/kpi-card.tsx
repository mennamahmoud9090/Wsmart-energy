import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface KpiCardProps {
  label: string
  value: string
  unit?: string
  icon: LucideIcon
  changePct?: number
  /** When true, an increase is shown as negative (e.g. anomalies). */
  invertTrend?: boolean
  caption?: string
  tone?: 'navy' | 'teal' | 'cyan' | 'amber' | 'red'
  isLoading?: boolean
}

const toneClasses: Record<NonNullable<KpiCardProps['tone']>, string> = {
  navy: 'bg-primary/8 text-primary',
  teal: 'bg-teal/10 text-teal',
  cyan: 'bg-cyan/12 text-[oklch(0.5_0.11_220)]',
  amber: 'bg-warning/15 text-warning-foreground',
  red: 'bg-destructive/10 text-destructive',
}

export function KpiCard({
  label,
  value,
  unit,
  icon: Icon,
  changePct,
  invertTrend = false,
  caption,
  tone = 'navy',
  isLoading = false,
}: KpiCardProps) {
  const up = (changePct ?? 0) >= 0
  const positive = invertTrend ? !up : up

  return (
    <Card className="gap-3 px-4 shadow-xs ring-border">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', toneClasses[tone])}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3.5 w-36" />
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="tabular flex items-baseline gap-1.5 text-2xl font-semibold tracking-tight text-foreground">
            {value}
            {unit && <span className="text-sm font-medium text-muted-foreground">{unit}</span>}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {changePct !== undefined && (
              <span
                className={cn(
                  'tabular inline-flex items-center gap-0.5 font-medium',
                  positive ? 'text-success' : 'text-destructive',
                )}
              >
                {up ? <ArrowUpRight className="size-3.5" aria-hidden="true" /> : <ArrowDownRight className="size-3.5" aria-hidden="true" />}
                {formatPercent(changePct)}
                <span className="sr-only">versus previous period</span>
              </span>
            )}
            {caption && <span className="text-muted-foreground">{caption}</span>}
          </div>
        </div>
      )}
    </Card>
  )
}
