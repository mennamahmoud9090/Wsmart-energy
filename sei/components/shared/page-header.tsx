import { SimulatedBadge } from './simulated-badge'

export function PageHeader({
  title,
  description,
  actions,
  simulated = true,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  simulated?: boolean
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-foreground text-balance">{title}</h1>
          {simulated && <SimulatedBadge />}
        </div>
        {description && <p className="max-w-2xl text-sm text-muted-foreground text-pretty">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
