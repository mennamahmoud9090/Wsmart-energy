import { cn } from '@/lib/utils'

/** Small label/value tile for summary rows inside cards. */
export function StatTile({
  label,
  value,
  unit,
  hint,
  className,
}: {
  label: string
  value: string
  unit?: string
  hint?: string
  className?: string
}) {
  return (
    <div className={cn('rounded-lg border border-border bg-muted/40 p-3', className)}>
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="tabular mt-1 text-lg font-semibold text-foreground">
        {value} {unit && <span className="text-xs font-normal text-muted-foreground">{unit}</span>}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
