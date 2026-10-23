import { FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SimulatedBadge({ className, label = 'Simulated data' }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning-foreground',
        className,
      )}
    >
      <FlaskConical className="size-3" aria-hidden="true" />
      {label}
    </span>
  )
}

export function DemoOnlyBadge({ className, label = 'Demo only' }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground',
        className,
      )}
    >
      {label}
    </span>
  )
}
