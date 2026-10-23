'use client'

import { useState } from 'react'
import { Activity, CalendarRange, Cpu as MeterIcon, Gauge, MapPin, Zap } from 'lucide-react'
import { BarComparisonChart, TimeSeriesChart } from '@/components/charts/energy-charts'
import { ChartCard } from '@/components/shared/chart-card'
import { ExportCsvButton } from '@/components/shared/export-csv-button'
import { FilterBar, FilterSelect, type FilterOption } from '@/components/shared/filter-select'
import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatTile } from '@/components/shared/stat-tile'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useConsumption, useMeterComparison } from '@/hooks/use-platform-data'
import { referenceData } from '@/lib/api/energy-service'
import { REGION_OPTIONS } from '@/lib/filter-options'
import {
  formatCompact,
  formatDate,
  formatEnergy,
  formatMonth,
  formatNumber,
  formatPower,
  METER_TYPE_LABELS,
} from '@/lib/format'
import type { ConsumptionQuery, Granularity } from '@/lib/types'

const GRANULARITY_OPTIONS: FilterOption<Granularity>[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

const PERIOD_OPTIONS: Record<Granularity, FilterOption<string>[]> = {
  daily: [7, 14, 30, 60].map((n) => ({ value: String(n), label: `Last ${n} days` })),
  weekly: [4, 8, 12].map((n) => ({ value: String(n), label: `Last ${n} weeks` })),
  monthly: [3, 6, 12].map((n) => ({ value: String(n), label: `Last ${n} months` })),
}

const DEFAULT_PERIODS: Record<Granularity, number> = { daily: 30, weekly: 8, monthly: 6 }

const METER_OPTIONS: FilterOption<string>[] = [
  { value: 'all', label: 'All meters (aggregate)' },
  ...referenceData.sampleMeters.map((m) => ({ value: m.meter_id, label: `${m.meter_id} · ${m.site}` })),
]

const DEFAULT_QUERY: ConsumptionQuery = { granularity: 'daily', periods: 30, region: 'all', meterId: 'all' }

export function ConsumptionView() {
  const [query, setQuery] = useState<ConsumptionQuery>(DEFAULT_QUERY)
  const consumption = useConsumption(query)
  const meters = useMeterComparison({ granularity: query.granularity, periods: query.periods })

  const data = consumption.data
  const loading = consumption.isLoading && !data
  const metersLoading = meters.isLoading && !meters.data
  const xFormatter = query.granularity === 'monthly' ? formatMonth : formatDate
  const bucketLabel = { daily: 'day', weekly: 'week', monthly: 'month' }[query.granularity]
  const series = data?.series ?? []

  const highest = series.reduce<(typeof series)[number] | null>((m, p) => (!m || p.energy_kwh > m.energy_kwh ? p : m), null)
  const lowest = series.reduce<(typeof series)[number] | null>((m, p) => (!m || p.energy_kwh < m.energy_kwh ? p : m), null)
  const meanPerPeriod = series.length ? series.reduce((s, p) => s + p.energy_kwh, 0) / series.length : 0

  const locationRows = data?.by_location ?? []
  const meterRows = [...(meters.data ?? [])].sort((a, b) => b.energy_kwh - a.energy_kwh)

  return (
    <>
      <PageHeader
        title="Energy consumption analytics"
        description="Time-series consumption, peak demand, and comparisons by location and meter."
        actions={
          <ExportCsvButton
            filename={`consumption-${query.granularity}.csv`}
            headers={['period_start', 'energy_kwh', 'avg_active_power_kw', 'avg_reactive_power_kvar']}
            rows={series.map((p) => [p.timestamp, p.energy_kwh, p.active_power_kw, p.reactive_power_kvar])}
          />
        }
      />

      <FilterBar>
        <FilterSelect
          label="Granularity"
          icon={CalendarRange}
          value={query.granularity}
          options={GRANULARITY_OPTIONS}
          onChange={(granularity) => setQuery((q) => ({ ...q, granularity, periods: DEFAULT_PERIODS[granularity] }))}
        />
        <FilterSelect
          label="Period"
          value={String(query.periods)}
          options={PERIOD_OPTIONS[query.granularity]}
          onChange={(periods) => setQuery((q) => ({ ...q, periods: Number(periods) }))}
        />
        <FilterSelect
          label="Region"
          icon={MapPin}
          value={query.region}
          options={REGION_OPTIONS}
          onChange={(region) => setQuery((q) => ({ ...q, region }))}
        />
        <FilterSelect
          label="Meter"
          icon={MeterIcon}
          value={query.meterId}
          options={METER_OPTIONS}
          onChange={(meterId) => setQuery((q) => ({ ...q, meterId }))}
          className="min-w-56"
        />
        <Button variant="ghost" size="sm" className="h-9 sm:ml-auto" onClick={() => setQuery(DEFAULT_QUERY)}>
          Reset filters
        </Button>
      </FilterBar>

      <section aria-label="Consumption summary" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total energy"
          value={data ? formatEnergy(data.totals.energy_kwh).split(' ')[0]! : '—'}
          unit={data ? formatEnergy(data.totals.energy_kwh).split(' ')[1] : undefined}
          icon={Zap}
          caption={`Across ${series.length} ${bucketLabel}s`}
          isLoading={loading}
        />
        <KpiCard
          label="Average active power"
          value={data ? formatCompact(data.totals.avg_active_power_kw) : '—'}
          unit="kW"
          icon={Activity}
          tone="teal"
          caption="Mean over the selected period"
          isLoading={loading}
        />
        <KpiCard
          label="Peak active power"
          value={data ? formatCompact(data.totals.peak_active_power_kw) : '—'}
          unit="kW"
          icon={Gauge}
          tone="cyan"
          caption="Highest hourly demand observed"
          isLoading={loading}
        />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Energy consumption over time"
          description={`Energy (kWh) per ${bucketLabel}`}
          isLoading={loading}
          error={consumption.error}
          onRetry={() => consumption.mutate()}
          isEmpty={series.length === 0}
        >
          <TimeSeriesChart
            data={series}
            xKey="timestamp"
            xFormatter={xFormatter}
            yFormatter={formatCompact}
            series={[{ key: 'energy_kwh', label: 'Energy', color: 'var(--chart-1)', unit: 'kWh' }]}
          />
        </ChartCard>
        <ChartCard
          title="Consumption summary"
          description="Highest, lowest and mean period"
          isLoading={loading}
          error={consumption.error}
          onRetry={() => consumption.mutate()}
          isEmpty={series.length === 0}
        >
          <div className="grid gap-3">
            <StatTile
              label={`Highest ${bucketLabel}`}
              value={highest ? formatEnergy(highest.energy_kwh) : '—'}
              hint={highest ? xFormatter(highest.timestamp) : undefined}
            />
            <StatTile
              label={`Lowest ${bucketLabel}`}
              value={lowest ? formatEnergy(lowest.energy_kwh) : '—'}
              hint={lowest ? xFormatter(lowest.timestamp) : undefined}
            />
            <StatTile label={`Mean per ${bucketLabel}`} value={formatEnergy(meanPerPeriod)} />
          </div>
        </ChartCard>
      </div>

      <ChartCard
        title="Average and reactive power"
        description="Mean active power (kW) and reactive power (kVAr) per period"
        isLoading={loading}
        error={consumption.error}
        onRetry={() => consumption.mutate()}
        isEmpty={series.length === 0}
      >
        <TimeSeriesChart
          data={series}
          xKey="timestamp"
          xFormatter={xFormatter}
          yFormatter={formatCompact}
          variant="line"
          series={[
            { key: 'active_power_kw', label: 'Active power', color: 'var(--chart-2)', unit: 'kW' },
            { key: 'reactive_power_kvar', label: 'Reactive power', color: 'var(--chart-4)', unit: 'kVAr' },
          ]}
        />
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Comparison by location"
          description="Total energy per site for the selected period (kWh)"
          isLoading={loading}
          error={consumption.error}
          onRetry={() => consumption.mutate()}
          isEmpty={locationRows.length === 0}
          emptyTitle={query.meterId === 'all' ? undefined : 'Location comparison is hidden for a single meter'}
          emptyDescription={query.meterId === 'all' ? undefined : 'Select "All meters" to compare sites.'}
        >
          <BarComparisonChart
            data={locationRows.slice(0, 15)}
            categoryKey="location"
            valueFormatter={formatCompact}
            series={[{ key: 'energy_kwh', label: 'Energy', color: 'var(--chart-2)', unit: 'kWh' }]}
            className="h-96"
            categoryWidth={130}
          />
        </ChartCard>
        <ChartCard
          title="Comparison by meter"
          description="Sample meters over the same period (kWh)"
          isLoading={metersLoading}
          error={meters.error}
          onRetry={() => meters.mutate()}
          isEmpty={meterRows.length === 0}
        >
          <BarComparisonChart
            data={meterRows}
            categoryKey="meter_id"
            valueFormatter={formatCompact}
            series={[{ key: 'energy_kwh', label: 'Energy', color: 'var(--chart-3)', unit: 'kWh' }]}
            className="h-96"
            categoryWidth={110}
          />
        </ChartCard>
      </div>

      <ChartCard
        title="Meter detail"
        description="Energy and demand per sample meter"
        isLoading={metersLoading}
        error={meters.error}
        onRetry={() => meters.mutate()}
        isEmpty={meterRows.length === 0}
        contentClassName="px-0"
        action={
          <ExportCsvButton
            filename="meter-comparison.csv"
            headers={['meter_id', 'site', 'region', 'meter_type', 'energy_kwh', 'avg_active_power_kw', 'peak_active_power_kw']}
            rows={meterRows.map((m) => [m.meter_id, m.site, m.region, m.meter_type, m.energy_kwh, m.avg_active_power_kw, m.peak_active_power_kw])}
          />
        }
      >
        <div className="px-1">
          <Table>
            <caption className="sr-only">Energy and demand per sample meter</caption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Meter ID</TableHead>
                <TableHead className="text-xs">Site</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-right text-xs">Energy</TableHead>
                <TableHead className="text-right text-xs">Avg power</TableHead>
                <TableHead className="text-right text-xs">Peak power</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meterRows.map((m) => (
                <TableRow key={m.meter_id}>
                  <TableCell className="font-mono text-xs font-medium text-foreground">{m.meter_id}</TableCell>
                  <TableCell className="text-sm">
                    {m.site} <span className="text-xs text-muted-foreground">· {m.region}</span>
                  </TableCell>
                  <TableCell className="text-sm">{METER_TYPE_LABELS[m.meter_type]}</TableCell>
                  <TableCell className="tabular text-right text-sm">{formatEnergy(m.energy_kwh)}</TableCell>
                  <TableCell className="tabular text-right text-sm">{formatPower(m.avg_active_power_kw, 2)}</TableCell>
                  <TableCell className="tabular text-right text-sm">{formatNumber(m.peak_active_power_kw, 2)} kW</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ChartCard>
    </>
  )
}
