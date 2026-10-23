import { AlertCircle, Inbox, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function LoadingState({ className, label = 'Loading data' }: { className?: string; label?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn('flex h-full min-h-48 flex-col gap-3', className)}>
      <span className="sr-only">{label}</span>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="w-full flex-1" />
    </div>
  )
}

export function EmptyState({
  className,
  title = 'No data for these filters',
  description = 'Try widening the date range or selecting a different region.',
}: {
  className?: string
  title?: string
  description?: string
}) {
  return (
    <div className={cn('flex h-full min-h-48 flex-col items-center justify-center gap-2 text-center', className)}>
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="size-5" aria-hidden="true" />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

export function ErrorState({
  className,
  message,
  onRetry,
}: {
  className?: string
  message?: string
  onRetry?: () => void
}) {
  return (
    <div
      role="alert"
      className={cn('flex h-full min-h-48 flex-col items-center justify-center gap-2 text-center', className)}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-5" aria-hidden="true" />
      </span>
      <p className="text-sm font-medium text-foreground">Unable to load data</p>
      <p className="max-w-xs text-xs text-muted-foreground">{message ?? 'The data service did not respond.'}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          <RotateCw data-icon="inline-start" />
          Retry
        </Button>
      )}
    </div>
  )
}

/** Renders loading / error / empty states, or children when data is ready. */
export function DataBoundary({
  isLoading,
  error,
  isEmpty,
  onRetry,
  emptyTitle,
  emptyDescription,
  className,
  children,
}: {
  isLoading: boolean
  error?: unknown
  isEmpty?: boolean
  onRetry?: () => void
  emptyTitle?: string
  emptyDescription?: string
  className?: string
  children: React.ReactNode
}) {
  if (error) {
    return (
      <ErrorState
        className={className}
        message={error instanceof Error ? error.message : undefined}
        onRetry={onRetry}
      />
    )
  }
  if (isLoading) return <LoadingState className={className} />
  if (isEmpty) return <EmptyState className={className} title={emptyTitle} description={emptyDescription} />
  return <>{children}</>
}
