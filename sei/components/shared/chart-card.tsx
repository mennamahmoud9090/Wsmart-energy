import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { DataBoundary } from './data-state'

export interface ChartCardProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  contentClassName?: string
  isLoading?: boolean
  error?: unknown
  isEmpty?: boolean
  onRetry?: () => void
  emptyTitle?: string
  emptyDescription?: string
  footer?: React.ReactNode
  children: React.ReactNode
}

export function ChartCard({
  title,
  description,
  action,
  className,
  contentClassName,
  isLoading = false,
  error,
  isEmpty,
  onRetry,
  emptyTitle,
  emptyDescription,
  footer,
  children,
}: ChartCardProps) {
  return (
    <Card className={cn('gap-4 shadow-xs ring-border', className)}>
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className={cn('flex-1', contentClassName)}>
        <DataBoundary
          isLoading={isLoading}
          error={error}
          isEmpty={isEmpty}
          onRetry={onRetry}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          className="min-h-64"
        >
          {children}
        </DataBoundary>
      </CardContent>
      {footer && !isLoading && !error && !isEmpty && (
        <div className="border-t border-border px-4 pt-3 text-xs text-muted-foreground">{footer}</div>
      )}
    </Card>
  )
}
