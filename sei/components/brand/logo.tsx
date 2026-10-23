import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal text-white shadow-sm',
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
      </svg>
    </span>
  )
}

export function Logo({ collapsed = false, inverted = false }: { collapsed?: boolean; inverted?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark />
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <p className={cn('truncate text-sm font-semibold', inverted ? 'text-white' : 'text-primary')}>
            Smart Energy
          </p>
          <p className={cn('truncate text-xs', inverted ? 'text-sidebar-foreground/70' : 'text-muted-foreground')}>
            Intelligence Platform
          </p>
        </div>
      )}
    </div>
  )
}
