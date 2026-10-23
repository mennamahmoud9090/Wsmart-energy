'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface SeriesDef {
  key: string
  label: string
  color: string
  unit?: string
}

function toConfig(series: SeriesDef[]): ChartConfig {
  return Object.fromEntries(series.map((s) => [s.key, { label: s.label, color: s.color }]))
}

function unitFormatter(series: SeriesDef[], digits = 1) {
  return (value: unknown, name: unknown) => {
    const s = series.find((x) => x.key === name)
    return (
      <div className="flex w-full items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-[2px]" style={{ background: s?.color }} aria-hidden="true" />
          {s?.label ?? String(name)}
        </span>
        <span className="tabular font-mono font-medium text-foreground">
          {formatNumber(Number(value), digits)}
          {s?.unit ? ` ${s.unit}` : ''}
        </span>
      </div>
    )
  }
}

const axisProps = {
  tickLine: false,
  axisLine: false,
  tickMargin: 8,
  fontSize: 11,
} as const

/** Area/line time series with one or more series sharing an axis. */
export function TimeSeriesChart<T extends object>({
  data,
  xKey,
  series,
  xFormatter,
  yFormatter = (v) => formatNumber(v, 0),
  variant = 'area',
  referenceLines = [],
  className,
  showLegend = series.length > 1,
  digits = 1,
}: {
  data: T[]
  xKey: keyof T & string
  series: SeriesDef[]
  xFormatter?: (value: string) => string
  yFormatter?: (value: number) => string
  variant?: 'area' | 'line'
  referenceLines?: { y: number; label: string; color: string }[]
  className?: string
  showLegend?: boolean
  digits?: number
}) {
  const Chart = variant === 'area' ? AreaChart : LineChart
  return (
    <ChartContainer config={toConfig(series)} className={cn('aspect-auto h-72 w-full', className)}>
      <Chart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.22} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0.01} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey={xKey} {...axisProps} minTickGap={28} tickFormatter={xFormatter} />
        <YAxis {...axisProps} width={56} tickFormatter={yFormatter} domain={['auto', 'auto']} />
        <ChartTooltip
          cursor={{ strokeDasharray: '3 3' }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const raw = payload?.[0]?.payload?.[xKey]
                return xFormatter ? xFormatter(String(raw)) : String(raw)
              }}
              formatter={unitFormatter(series, digits)}
            />
          }
        />
        {referenceLines.map((r) => (
          <ReferenceLine
            key={r.label}
            y={r.y}
            stroke={r.color}
            strokeDasharray="4 4"
            label={{ value: r.label, position: 'insideTopRight', fontSize: 10, fill: r.color }}
          />
        ))}
        {series.map((s) =>
          variant === 'area' ? (
            <Area
              key={s.key}
              dataKey={s.key}
              type="monotone"
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#fill-${s.key})`}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ) : (
            <Line key={s.key} dataKey={s.key} type="monotone" stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          ),
        )}
        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
      </Chart>
    </ChartContainer>
  )
}

/** Vertical or horizontal bar comparison, optionally with per-bar colors. */
export function BarComparisonChart<T extends object>({
  data,
  categoryKey,
  series,
  layout = 'vertical',
  valueFormatter = (v) => formatNumber(v, 0),
  colorFor,
  referenceLines = [],
  className,
  categoryWidth = 120,
  digits = 0,
  onBarClick,
}: {
  data: T[]
  categoryKey: keyof T & string
  series: SeriesDef[]
  /** "vertical" = horizontal bars listed top-to-bottom (good for long labels). */
  layout?: 'vertical' | 'horizontal'
  valueFormatter?: (value: number) => string
  colorFor?: (row: T) => string
  referenceLines?: { value: number; label: string; color: string }[]
  className?: string
  categoryWidth?: number
  digits?: number
  onBarClick?: (row: T) => void
}) {
  const horizontalBars = layout === 'vertical'
  return (
    <ChartContainer config={toConfig(series)} className={cn('aspect-auto h-72 w-full', className)}>
      <BarChart
        data={data}
        layout={layout}
        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        barCategoryGap={horizontalBars ? 6 : '20%'}
      >
        <CartesianGrid horizontal={!horizontalBars} vertical={horizontalBars} strokeDasharray="3 3" />
        {horizontalBars ? (
          <>
            <XAxis type="number" {...axisProps} tickFormatter={valueFormatter} />
            <YAxis type="category" dataKey={categoryKey} {...axisProps} width={categoryWidth} interval={0} />
          </>
        ) : (
          <>
            <XAxis dataKey={categoryKey} {...axisProps} interval={0} />
            <YAxis {...axisProps} width={56} tickFormatter={valueFormatter} />
          </>
        )}
        <ChartTooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltipContent formatter={unitFormatter(series, digits)} />} />
        {referenceLines.map((r) => (
          <ReferenceLine
            key={r.label}
            {...(horizontalBars ? { x: r.value } : { y: r.value })}
            stroke={r.color}
            strokeDasharray="4 4"
            label={{ value: r.label, position: horizontalBars ? 'top' : 'insideTopRight', fontSize: 10, fill: r.color }}
          />
        ))}
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            fill={s.color}
            radius={horizontalBars ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            maxBarSize={28}
            className={onBarClick ? 'cursor-pointer' : undefined}
            onClick={onBarClick ? (entry) => onBarClick((entry as { payload: T }).payload) : undefined}
          >
            {colorFor && data.map((row, i) => <Cell key={i} fill={colorFor(row)} />)}
          </Bar>
        ))}
        {series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
      </BarChart>
    </ChartContainer>
  )
}

/** Average vs. peak demand per hour of day. */
export function HourlyProfileChart({
  data,
  className,
}: {
  data: { hour: number; avg_active_power_kw: number; peak_active_power_kw: number }[]
  className?: string
}) {
  const series: SeriesDef[] = [
    { key: 'avg_active_power_kw', label: 'Average power', color: 'var(--chart-1)', unit: 'kW' },
    { key: 'peak_active_power_kw', label: 'Peak power', color: 'var(--chart-3)', unit: 'kW' },
  ]
  const rows = data.map((d) => ({ ...d, label: `${String(d.hour).padStart(2, '0')}:00` }))
  return (
    <ChartContainer config={toConfig(series)} className={cn('aspect-auto h-72 w-full', className)}>
      <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" {...axisProps} interval={2} />
        <YAxis {...axisProps} width={56} tickFormatter={(v) => formatNumber(v, 0)} />
        <ChartTooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltipContent formatter={unitFormatter(series)} />} />
        <Bar dataKey="avg_active_power_kw" fill="var(--chart-1)" radius={[3, 3, 0, 0]} maxBarSize={18} />
        <Line dataKey="peak_active_power_kw" type="monotone" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
        <ChartLegend content={<ChartLegendContent />} />
      </ComposedChart>
    </ChartContainer>
  )
}

/** Donut chart with a center total and a legend list. */
export function DonutChart({
  data,
  centerLabel,
  className,
}: {
  data: { key: string; label: string; value: number; color: string }[]
  centerLabel: string
  className?: string
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const config: ChartConfig = Object.fromEntries(data.map((d) => [d.key, { label: d.label, color: d.color }]))
  return (
    <div className={cn('flex flex-col items-center gap-4 sm:flex-row lg:flex-col xl:flex-row', className)}>
      <ChartContainer config={config} className="relative aspect-square h-48 shrink-0">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
          <Pie data={data} dataKey="value" nameKey="key" innerRadius={58} outerRadius={84} paddingAngle={2} strokeWidth={0}>
            {data.map((d) => (
              <Cell key={d.key} fill={d.color} />
            ))}
          </Pie>
          <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-semibold">
            {formatNumber(total, 0)}
          </text>
          <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[11px]">
            {centerLabel}
          </text>
        </PieChart>
      </ChartContainer>
      <ul className="flex w-full flex-col gap-2.5">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: d.color }} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{d.label}</span>
            <span className="tabular font-medium text-foreground">{formatNumber(d.value, 0)}</span>
            <span className="tabular w-11 text-right text-xs text-muted-foreground">
              {total > 0 ? `${Math.round((d.value / total) * 100)}%` : '0%'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
