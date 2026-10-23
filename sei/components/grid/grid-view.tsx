'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, Calendar, Gauge, MapPin, TrendingDown, UtilityPole } from 'lucide-react'
import { BarComparisonChart, TimeSeriesChart, type SeriesDef } from '@/components/charts/energy-charts'
import { ChartCard } from '@/components/shared/chart-card'
import { ExportCsvButton } from '@/components/shared/export-csv-button'
import { FilterBar, FilterSelect } from '@/components/shared/filter-select'
import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { TransformerStatusBadge } from '@/components/shared/status-badges'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useGrid } from '@/hooks/use-platform-data'
import { gridThresholds, voltageBand } from '@/lib/config'
import { RANGE_OPTIONS, REGION_OPTIONS } from '@/lib/filter-options'
import { formatDate, formatInteger, formatNumber, formatTime } from '@/lib/format'
import type { GridQuery, Region, Transformer, TransformerStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const STATUS_COLOR: Record<TransformerStatus, string> = {
  normal: 'var(--success)',
  warning: 'var(--warning)',
  overloaded: 'var(--destructive)',
}

const REGION_SERIES: SeriesDef[] = (['North', 'South', 'East', 'West', 'Central'] as Region[]).map((region, i) => ({
  key: region,
  label: region,
  color: `var(--chart-${i + 1})`,
  unit: 'V',
}))

const DEFAULT_QUERY: GridQuery = { region: 'all', range: '7d' }

interface GridAlert {
  id: string
  kind: 'Transformer overload' | 'Voltage drop'
  subject: string
  detail: string
  severity: 'warning' | 'critical'
}

function LoadingBar({ pct, status }: { pct: number; status: TransformerStatus }) {
  return (
    <div className="flex min-w-32 items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" role="presentation">
        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: STATUS_COLOR[status] }} />
      </div>
      <span className="tabular w-12 text-right text-xs text-foreground">{formatNumber(pct, 1)}%</span>
    </div>
  )
}

export function GridView() {
  const [query, setQuery] = useState<GridQuery>(DEFAULT_QUERY)
  const { data, error, isLoading, mutate } = useGrid(query)
  const loading = isLoading && !data

  const transformers = data?.transformers ?? []
  const sorted = useMemo(() => [...transformers].sort((a, b) => b.loading_pct - a.loading_pct), [transformers])
  const overloaded = transformers.filter((t) => t.status === 'overloaded')
  const warning = transformers.filter((t) => t.status === 'warning')

  const regionsInScope = query.region === 'all' ? REGION_SERIES : REGION_SERIES.filter((s) => s.key === query.region)
  const voltage = data?.voltage_series ?? []
  const lowSamples = useMemo(
    () =>
      regionsInScope.map((s) => ({
        region: s.key as Region,
        count: voltage.filter((p) => p[s.key as Region] < voltageBand.min).length,
        min: voltage.length ? Math.min(...voltage.map((p) => p[s.key as Region])) : 0,
      })),
    [regionsInScope, voltage],
  )
  const minVoltage = lowSamples.length && voltage.length ? Math.min(...lowSamples.map((s) => s.min)) : null

  // Alerts are derived on the client from the simulated readings using the configured thresholds.
  const gridAlerts: GridAlert[] = [
    ...overloaded.map<GridAlert>((t) => ({
      id: `ovl-${t.transformer_id}`,
      kind: 'Transformer overload',
      subject: `${t.transformer_id} · ${t.site}`,
      detail: `Loading ${formatNumber(t.loading_pct, 1)}% ≥ ${gridThresholds.transformerOverloadPct}% of ${formatInteger(t.rated_capacity_kva)} kVA rating`,
      severity: 'critical',
    })),
    ...lowSamples
      .filter((s) => s.count > 0)
      .map<GridAlert>((s) => ({
        id: `vdrop-${s.region}`,
        kind: 'Voltage drop',
        subject: `${s.region} region`,
        detail: `${s.count} samples below ${formatNumber(voltageBand.min, 1)} V (lowest ${formatNumber(s.min, 1)} V)`,
        severity: s.min < voltageBand.min - 5 ? 'critical' : 'warning',
      })),
  ]

  const xFormatter = query.range === '24h' ? formatTime : formatDate

  return (
    <>
      <PageHeader
        title="Grid & transformer health"
        description="Transformer loading, voltage compliance, and threshold-based overload and voltage-drop alerts."
        actions={
          <ExportCsvButton
            filename="transformer-health.csv"
            headers={['transformer_id', 'site', 'region', 'rated_kva', 'load_kva', 'loading_pct', 'peak_kw', 'avg_voltage_v', 'meters', 'status']}
            rows={sorted.map((t) => [t.transformer_id, t.site, t.region, t.rated_capacity_kva, t.current_load_kva, t.loading_pct, t.peak_demand_kw, t.avg_voltage_v, t.connected_meters, t.status])}
          />
        }
      />

      <FilterBar>
        <FilterSelect
          label="Date range"
          icon={Calendar}
          value={query.range}
          options={RANGE_OPTIONS}
          onChange={(range) => setQuery((q) => ({ ...q, range }))}
        />
        <FilterSelect
          label="Region"
          icon={MapPin}
          value={query.region}
          options={REGION_OPTIONS}
          onChange={(region) => setQuery((q) => ({ ...q, region }))}
        />
        <Button variant="ghost" size="sm" className="h-9 sm:ml-auto" onClick={() => setQuery(DEFAULT_QUERY)}>
          Reset filters
        </Button>
      </FilterBar>

      <section aria-label="Grid summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Transformers monitored" value={data ? formatInteger(transformers.length) : '—'} icon={UtilityPole} isLoading={loading} caption="In the selected scope" />
        <KpiCard
          label="Overloaded"
          value={data ? formatInteger(overloaded.length) : '—'}
          icon={AlertTriangle}
          tone="red"
          isLoading={loading}
          caption={`≥ ${gridThresholds.transformerOverloadPct}% of rated capacity`}
        />
        <KpiCard
          label="Near limit"
          value={data ? formatInteger(warning.length) : '—'}
          icon={Gauge}
          tone="amber"
          isLoading={loading}
          caption={`${gridThresholds.transformerWarningPct}–${gridThresholds.transformerOverloadPct}% of rated capacity`}
        />
        <KpiCard
          label="Lowest voltage"
          value={minVoltage !== null ? formatNumber(minVoltage, 1) : '—'}
          unit="V"
          icon={TrendingDown}
          tone="cyan"
          isLoading={loading}
          caption={`Band ${formatNumber(voltageBand.min, 0)}–${formatNumber(voltageBand.max, 0)} V`}
        />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Voltage by region"
          description={`Average supply voltage (V) with the ±${gridThresholds.voltageTolerancePct}% tolerance band`}
          isLoading={loading}
          error={error}
          onRetry={() => mutate()}
          isEmpty={voltage.length === 0}
        >
          <TimeSeriesChart
            data={voltage}
            xKey="timestamp"
            xFormatter={xFormatter}
            variant="line"
            yFormatter={(v) => formatNumber(v, 0)}
            series={regionsInScope}
            referenceLines={[
              { y: voltageBand.min, label: `Lower ${formatNumber(voltageBand.min, 0)} V`, color: 'var(--destructive)' },
              { y: voltageBand.max, label: `Upper ${formatNumber(voltageBand.max, 0)} V`, color: 'var(--warning)' },
            ]}
            showLegend
          />
        </ChartCard>
        <ChartCard
          title="Grid alerts"
          description="Derived from thresholds on simulated readings"
          isLoading={loading}
          error={error}
          onRetry={() => mutate()}
          isEmpty={transformers.length === 0}
        >
          {gridAlerts.length === 0 ? (
            <p className="rounded-lg bg-success/10 p-3 text-sm text-success">No overloads or voltage drops in this scope.</p>
          ) : (
            <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
              {gridAlerts.map((a) => (
                <li
                  key={a.id}
                  className={cn(
                    'rounded-lg border p-3 text-sm',
                    a.severity === 'critical' ? 'border-destructive/30 bg-destructive/5' : 'border-warning/40 bg-warning/10',
                  )}
                >
                  <p className="flex items-center gap-1.5 font-medium text-foreground">
                    <AlertTriangle
                      className={cn('size-3.5', a.severity === 'critical' ? 'text-destructive' : 'text-warning-foreground')}
                      aria-hidden="true"
                    />
                    {a.kind}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground">{a.subject}</p>
                  <p className="text-xs text-muted-foreground">{a.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>

      <ChartCard
        title="Transformer loading"
        description="Highest-loaded transformers as a share of rated capacity"
        isLoading={loading}
        error={error}
        onRetry={() => mutate()}
        isEmpty={transformers.length === 0}
      >
        <BarComparisonChart
          data={sorted.slice(0, 15)}
          categoryKey="transformer_id"
          valueFormatter={(v) => `${formatNumber(v, 0)}%`}
          series={[{ key: 'loading_pct', label: 'Loading', color: 'var(--chart-1)', unit: '%' }]}
          colorFor={(t: Transformer) => STATUS_COLOR[t.status]}
          referenceLines={[
            { value: gridThresholds.transformerWarningPct, label: 'Warning', color: 'var(--warning)' },
            { value: gridThresholds.transformerOverloadPct, label: 'Overload', color: 'var(--destructive)' },
          ]}
          className="h-[28rem]"
          categoryWidth={80}
          digits={1}
        />
      </ChartCard>

      <ChartCard
        title="Regional summary"
        description="Loading and voltage by region"
        isLoading={loading}
        error={error}
        onRetry={() => mutate()}
        isEmpty={(data?.regions.length ?? 0) === 0}
        contentClassName="px-0"
      >
        <div className="px-1">
          <Table>
            <caption className="sr-only">Regional grid summary</caption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Region</TableHead>
                <TableHead className="text-right text-xs">Transformers</TableHead>
                <TableHead className="text-right text-xs">Overloaded</TableHead>
                <TableHead className="text-right text-xs">Avg loading</TableHead>
                <TableHead className="text-right text-xs">Peak demand</TableHead>
                <TableHead className="text-right text-xs">Min voltage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.regions ?? []).map((r) => (
                <TableRow key={r.region}>
                  <TableCell className="text-sm font-medium text-foreground">{r.region}</TableCell>
                  <TableCell className="tabular text-right text-sm">{r.transformers}</TableCell>
                  <TableCell className={cn('tabular text-right text-sm', r.overloaded > 0 && 'font-medium text-destructive')}>
                    {r.overloaded}
                  </TableCell>
                  <TableCell className="tabular text-right text-sm">{formatNumber(r.avg_loading_pct, 1)}%</TableCell>
                  <TableCell className="tabular text-right text-sm">{formatNumber(r.peak_demand_kw, 0)} kW</TableCell>
                  <TableCell className={cn('tabular text-right text-sm', r.min_voltage_v < voltageBand.min && 'font-medium text-destructive')}>
                    {formatNumber(r.min_voltage_v, 1)} V
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ChartCard>

      <ChartCard
        title="All transformers"
        description="Sorted by loading, highest first"
        isLoading={loading}
        error={error}
        onRetry={() => mutate()}
        isEmpty={transformers.length === 0}
        contentClassName="px-0"
      >
        <div className="px-1">
          <Table>
            <caption className="sr-only">Transformer health</caption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Transformer</TableHead>
                <TableHead className="text-xs">Site</TableHead>
                <TableHead className="text-right text-xs">Rated</TableHead>
                <TableHead className="text-xs">Loading</TableHead>
                <TableHead className="text-right text-xs">Peak demand</TableHead>
                <TableHead className="text-right text-xs">Voltage</TableHead>
                <TableHead className="text-right text-xs">Meters</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((t) => (
                <TableRow key={t.transformer_id}>
                  <TableCell className="font-mono text-xs font-medium text-foreground">{t.transformer_id}</TableCell>
                  <TableCell className="text-sm">
                    {t.site} <span className="text-xs text-muted-foreground">· {t.region}</span>
                  </TableCell>
                  <TableCell className="tabular text-right text-sm">{formatInteger(t.rated_capacity_kva)} kVA</TableCell>
                  <TableCell>
                    <LoadingBar pct={t.loading_pct} status={t.status} />
                  </TableCell>
                  <TableCell className="tabular text-right text-sm">{formatNumber(t.peak_demand_kw, 0)} kW</TableCell>
                  <TableCell
                    className={cn('tabular text-right text-sm', t.avg_voltage_v < voltageBand.min && 'font-medium text-destructive')}
                  >
                    {formatNumber(t.avg_voltage_v, 1)} V
                  </TableCell>
                  <TableCell className="tabular text-right text-sm">{formatInteger(t.connected_meters)}</TableCell>
                  <TableCell>
                    <TransformerStatusBadge status={t.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ChartCard>
    </>
  )
}
