'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Activity, ArrowRight, Calendar, Cpu as MeterIcon, Gauge, MapPin, Radio, ShieldAlert, Zap } from 'lucide-react'
import { AlertDetailsSheet } from '@/components/alerts/alert-details-sheet'
import { AlertsTable, ANOMALY_META } from '@/components/alerts/alerts-table'
import { BarComparisonChart, DonutChart, HourlyProfileChart, TimeSeriesChart } from '@/components/charts/energy-charts'
import { ChartCard } from '@/components/shared/chart-card'
import { FilterBar, FilterSelect } from '@/components/shared/filter-select'
import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { useDashboard } from '@/hooks/use-platform-data'
import { METER_TYPE_OPTIONS, RANGE_OPTIONS, REGION_OPTIONS } from '@/lib/filter-options'
import {
  ANOMALY_LABELS,
  formatCompact,
  formatDate,
  formatDateTime,
  formatEnergy,
  formatInteger,
  formatNumber,
  formatTime,
} from '@/lib/format'
import type { Alert, DashboardFilters } from '@/lib/types'

export function DashboardView() {
  const [filters, setFilters] = useState<DashboardFilters>({ range: '7d', region: 'all', meterType: 'all' })
  const [selected, setSelected] = useState<Alert | null>(null)
  const { data, error, isLoading, mutate } = useDashboard(filters)

  const loading = isLoading && !data
  const kpis = data?.kpis
  const xFormatter = filters.range === '24h' ? formatTime : formatDate
  const [energyValue, energyUnit] = kpis ? formatEnergy(kpis.total_energy_kwh.value).split(' ') : ['—', '']
  const energy = { value: energyValue, unit: energyUnit }
  const rangeLabel = RANGE_OPTIONS.find((r) => r.value === filters.range)?.label.toLowerCase()

  return (
    <>
      <PageHeader
        title="Grid operations dashboard"
        description="Fleet-wide view of simulated smart meter readings aggregated at 15-minute intervals."
      />

      <FilterBar>
        <FilterSelect
          label="Date range"
          icon={Calendar}
          value={filters.range}
          options={RANGE_OPTIONS}
          onChange={(range) => setFilters((f) => ({ ...f, range }))}
        />
        <FilterSelect
          label="Region"
          icon={MapPin}
          value={filters.region}
          options={REGION_OPTIONS}
          onChange={(region) => setFilters((f) => ({ ...f, region }))}
        />
        <FilterSelect
          label="Meter type"
          icon={MeterIcon}
          value={filters.meterType}
          options={METER_TYPE_OPTIONS}
          onChange={(meterType) => setFilters((f) => ({ ...f, meterType }))}
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-9 sm:ml-auto"
          onClick={() => setFilters({ range: '7d', region: 'all', meterType: 'all' })}
        >
          Reset filters
        </Button>
      </FilterBar>

      <section aria-label="Key performance indicators" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Total energy consumption"
          value={energy.value}
          unit={energy.unit}
          icon={Zap}
          changePct={kpis?.total_energy_kwh.change_pct}
          caption={`Over the ${rangeLabel}`}
          isLoading={loading}
        />
        <KpiCard
          label="Average active power"
          value={kpis ? formatCompact(kpis.avg_active_power_kw.value) : '—'}
          unit="kW"
          icon={Activity}
          tone="teal"
          changePct={kpis?.avg_active_power_kw.change_pct}
          caption="Mean of 15-min intervals"
          isLoading={loading}
        />
        <KpiCard
          label="Peak demand"
          value={kpis ? formatCompact(kpis.peak_demand_kw.value) : '—'}
          unit="kW"
          icon={Gauge}
          tone="cyan"
          changePct={kpis?.peak_demand_kw.change_pct}
          caption={kpis?.peak_demand_kw.peak_timestamp ? `At ${formatDateTime(kpis.peak_demand_kw.peak_timestamp)}` : undefined}
          isLoading={loading}
        />
        <KpiCard
          label="Active smart meters"
          value={kpis ? formatInteger(kpis.active_meters.value) : '—'}
          icon={Radio}
          tone="navy"
          changePct={kpis?.active_meters.change_pct}
          caption={kpis ? `of ${formatInteger(kpis.active_meters.total_meters)} installed` : undefined}
          isLoading={loading}
        />
        <KpiCard
          label="Active anomalies"
          value={kpis ? formatInteger(kpis.anomalies_detected.value) : '—'}
          icon={ShieldAlert}
          tone="red"
          invertTrend
          changePct={kpis?.anomalies_detected.change_pct}
          caption={kpis ? `${kpis.anomalies_detected.critical} critical · ${kpis.anomalies_detected.total} detected in period` : undefined}
          isLoading={loading}
        />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Energy consumption trend"
          description={`Aggregated energy (kWh) per ${filters.range === '24h' ? 'hour' : 'day'} · simulated`}
          isLoading={loading}
          error={error}
          onRetry={() => mutate()}
          isEmpty={data?.trend.length === 0}
        >
          <TimeSeriesChart
            data={data?.trend ?? []}
            xKey="timestamp"
            xFormatter={xFormatter}
            yFormatter={formatCompact}
            series={[{ key: 'energy_kwh', label: 'Energy', color: 'var(--chart-1)', unit: 'kWh' }]}
          />
        </ChartCard>
        <ChartCard
          title="Hourly demand profile"
          description="Average vs. peak active power by hour of day (kW)"
          isLoading={loading}
          error={error}
          onRetry={() => mutate()}
          isEmpty={data?.hourly_profile.length === 0}
        >
          <HourlyProfileChart data={data?.hourly_profile ?? []} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Consumption by location"
          description="Total energy per site for the selected period (kWh)"
          isLoading={loading}
          error={error}
          onRetry={() => mutate()}
          isEmpty={data?.by_location.length === 0}
          action={
            <Button variant="ghost" size="sm" render={<Link href="/consumption" />}>
              Explore
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Button>
          }
        >
          <BarComparisonChart
            data={(data?.by_location ?? []).slice(0, 10)}
            categoryKey="location"
            valueFormatter={formatCompact}
            series={[{ key: 'energy_kwh', label: 'Energy', color: 'var(--chart-2)', unit: 'kWh' }]}
            className="h-80"
          />
        </ChartCard>
        <ChartCard
          title="Anomaly distribution"
          description="Detected anomalies by type"
          isLoading={loading}
          error={error}
          onRetry={() => mutate()}
          isEmpty={(data?.anomaly_distribution ?? []).every((d) => d.count === 0)}
          emptyTitle="No anomalies detected"
          emptyDescription="No anomalies match the current filters."
        >
          <DonutChart
            centerLabel="anomalies"
            data={(data?.anomaly_distribution ?? []).map((d) => ({
              key: d.anomaly_type,
              label: ANOMALY_LABELS[d.anomaly_type],
              value: d.count,
              color: ANOMALY_META[d.anomaly_type].color,
            }))}
          />
        </ChartCard>
      </div>

      <ChartCard
        title="Recent alerts"
        description="Latest anomaly alerts. Select a row for details."
        isLoading={loading}
        error={error}
        onRetry={() => mutate()}
        isEmpty={data?.recent_alerts.length === 0}
        emptyTitle="No recent alerts"
        emptyDescription="No alerts were raised for the selected filters."
        contentClassName="px-0"
        action={
          <Button variant="outline" size="sm" render={<Link href="/anomalies" />}>
            View all alerts
          </Button>
        }
        footer={
          data ? (
            <span>
              Showing {data.recent_alerts.length} most recent of {formatNumber(kpis?.anomalies_detected.total ?? 0)} simulated
              alerts.
            </span>
          ) : null
        }
      >
        <div className="px-1">
          <AlertsTable alerts={data?.recent_alerts ?? []} onSelect={setSelected} caption="Recent anomaly alerts" />
        </div>
      </ChartCard>

      <AlertDetailsSheet alert={selected} onClose={() => setSelected(null)} />
    </>
  )
}
