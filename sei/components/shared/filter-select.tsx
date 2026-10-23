'use client'

import type { LucideIcon } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface FilterOption<T extends string> {
  value: T
  label: string
}

export function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  icon: Icon,
  className,
}: {
  label: string
  value: T
  options: FilterOption<T>[]
  onChange: (value: T) => void
  icon?: LucideIcon
  className?: string
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
      <Select
        items={options}
        value={value}
        onValueChange={(next) => {
          if (next !== null && next !== undefined) onChange(next as T)
        }}
      >
        <SelectTrigger aria-label={label} className="h-9 w-full min-w-40 bg-card">
          {Icon && <Icon className="text-muted-foreground" aria-hidden="true" />}
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function FilterBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      role="group"
      aria-label="Filters"
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-xs sm:flex-row sm:flex-wrap sm:items-end',
        className,
      )}
    >
      {children}
    </div>
  )
}
