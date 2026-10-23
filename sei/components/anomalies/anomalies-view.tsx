'use client'

import { useMemo, useState } from 'react'
import { Calendar, FlaskConical, MapPin, Radar, ShieldAlert, SlidersHorizontal, Zap } from 'lucide-react'
import { AlertDetailsSheet } from '@/components/alerts/alert-details-sheet'
import { AlertsTable, ANOMALY_META } from '@/components/alerts/alerts-table'
import { BarComparisonChart, DonutChart } from '@/components/charts/energy-charts'
import { ChartCard } from '@/components/shared/chart-card'
import { ExportCsvButton } from '@/components/shared/export-csv-button'
import { FilterBar, FilterSelect, type FilterOption } from '@/components/shared/filter-select'
import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAlerts } from '@/hooks/use-platform-data'
import { referenceData } from '@/lib/api/energy-service'
import { RANGE_OPTIONS, REGION_OPTIONS } from '@/lib/filter-options'
import { ANOMALY_LABELS, formatInteger, SEVERITY_LABELS, STATUS_LABELS } from '@/lib/format'
import type { Alert, AlertOrigin, AlertStatus, AnomalyType, DateRange, Region, Severity } from '@/lib/types'

const PAGE_SIZE = 25

interface Filters {
  range: DateRange
  region: Region | 'all'
  location: string
  severity: Severity | 'all'
  type: AnomalyType | 'all'
  status: AlertStatus | 'all'
  origin: AlertOrigin | 'all'
  from: string
  to: string
}

const DEFAULTS: Filters = {
  range: '30d',
  region: 'all',
  location: 'all',
  severity: 'all',
  type: 'all',
  status: 'all',
  origin: 'all',
  from: '',
  to: '',
}

const SEVERITY_OPTIONS: FilterOption<Severity | 'all'>[] = [
  { value: 'all', label: 'All severities' },
  ...(['critical', 'high', 'medium', 'low'] as Severity[]).map((s) => ({ value: s, label: SEVERITY_LABELS[s] })),
]
const TYPE_OPTIONS: FilterOption<AnomalyType | 'all'>[] = [
  { value: 'all', label: 'All anomaly types' },
  ...(Object.keys(ANOMALY_LABELS) as AnomalyType[]).map((t) => ({ value: t, label: ANOMALY_LABELS[t] })),
]
const STATUS_OPTIONS: FilterOption<AlertStatus | 'all'>[] = [
  { value: 'all', label: 'All statuses' },
  ...(Object.keys(STATUS_LABELS) as AlertStatus[]).map((s) => ({ value: s, label: STATUS_LABELS[s] })),
]
const ORIGIN_OPTIONS: FilterOption<AlertOrigin | 'all'>[] = [
  { value: 'all', label: 'All sources' },
  { value: 'simulated', label: 'Simulated' },
  { value: 'detected', label: 'Detected (real pipeline)' },
]

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: 'var(--destructive)',
  high: 'var(--warning)',
  medium: 'var(--cyan)',
  low: 'var(--muted-foreground)',
}

export function AnomaliesView() {
  const [filters, setFilters] = useState<Filters>(DEFAULTS)
  const [selected, setSelected] = useState<Alert | null>(null)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const { data, error, isLoading, mutate } = useAlerts({ region: filters.region, range: filters.range })
  const loading = isLoading && !data

  const locationOptions: FilterOption<string>[] = useMemo(
    () => [
      { value: 'all', label: 'All locations' },
      ...referenceData.sites
        .filter((s) => filters.region === 'all' || s.region === filters.region)
        .map((s) => ({ value: s.name, label: s.name })),
    ],
    [filters.region],
  )

  const update = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }))
    setVisible(PAGE_SIZE)
  }

  const all = data ?? []
  const filtered = useMemo(() => {
    // Date inputs are interpreted as UTC calendar days, consistent with the timestamps shown in the UI.
    const from = filters.from ? `${filters.from}T00:00:00.000Z` : ''
    const to = filters.to ? `${filters.to}T23:59:59.999Z` : ''
    return all.filter(
      (a) =>
        (filters.location === 'all' || a.location === filters.location) &&
        (filters.severity === 'all' || a.severity === filters.severity) &&
        (filters.type === 'all' || a.anomaly_type === filters.type) &&
        (filters.status === 'all' || a.status === filters.status) &&
        (filters.origin === 'all' || a.origin === filters.origin) &&
        (!from || a.timestamp >= from) &&
        (!to || a.timestamp <= to),
    )
  }, [all, filters])

  const simulatedCount = all.filter((a) => a.origin === 'simulated').length
  const detectedCount = all.filter((a) => a.origin === 'detected').length
  const active = filtered.filter((a) => a.status === 'open' || a.status === 'investigating')
  const critical = filtered.filter((a) => a.severity === 'critical')
  const dateInvalid = Boolean(filters.from && filters.to && filters.from > filters.to)

  const bySeverity = (['critical', 'high', 'medium', 'low'] as Severity[]).map((s) => ({
    severity: SEVERITY_LABELS[s],
    key: s,
    count: filtered.filter((a) => a.severity === s).length,
  }))

  return (
    <>
      <PageHeader
        title="Anomaly detection"
        description="Load surges, persistent voltage drops and irregular consumption patterns, with filters and status tracking."
        simulated={detectedCount === 0}
        actions={
          <ExportCsvButton
            filename="anomalies.csv"
            headers={['alert_id', 'origin', 'timestamp', 'location', 'region', 'meter_id', 'transformer_id', 'anomaly_type', 'severity', 'status', 'observed_value', 'expected_value', 'unit']}
            rows={filtered.map((a) => [a.alert_id, a.origin, a.timestamp, a.location, a.region, a.meter_id, a.transformer_id, a.anomaly_type, a.severity, a.status, a.observed_value, a.expected_value, a.unit])}
          />
        }
      />

      <div
        role="note"
        className="flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm sm:flex-row sm:items-start"
      >
        <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning-foreground" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <p className="font-medium text-foreground">Simulated vs. detected anomalies</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Simulated</strong> alerts come from the demo generator in this front end (rule-based on
            synthetic readings). <strong className="text-foreground">Detected</strong> alerts would be produced by the Spark detection
            job on pipeline data and served by the backend API; none are connected yet. Right now:{' '}
            <span className="tabular font-medium text-foreground">{formatInteger(simulatedCount)}</span> simulated,{' '}
            <span className="tabular font-medium text-foreground">{formatInteger(detectedCount)}</span> detected in this date range.
          </p>
        </div>
      </div>

      <FilterBar>
        <FilterSelect label="Date range" icon={Calendar} value={filters.range} options={RANGE_OPTIONS} onChange={(range) => update({ range })} />
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor="anomaly-from" className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            From (UTC)
          </label>
          <Input
            id="anomaly-from"
            type="date"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(e) => update({ from: e.target.value })}
            className="h-9 w-40 bg-card"
            aria-invalid={dateInvalid}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor="anomaly-to" className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            To (UTC)
          </label>
          <Input
            id="anomaly-to"
            type="date"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(e) => update({ to: e.target.value })}
            className="h-9 w-40 bg-card"
            aria-invalid={dateInvalid}
          />
        </div>
        <FilterSelect
          label="Region"
          icon={MapPin}
          value={filters.region}
          options={REGION_OPTIONS}
          onChange={(region) => update({ region, location: 'all' })}
        />
        <FilterSelect label="Location" value={filters.location} options={locationOptions} onChange={(location) => update({ location })} />
        <FilterSelect label="Severity" icon={SlidersHorizontal} value={filters.severity} options={SEVERITY_OPTIONS} onChange={(severity) => update({ severity })} />
        <FilterSelect label="Type" value={filters.type} options={TYPE_OPTIONS} onChange={(type) => update({ type })} />
        <FilterSelect label="Status" value={filters.status} options={STATUS_OPTIONS} onChange={(status) => update({ status })} />
        <FilterSelect label="Source" icon={Radar} value={filters.origin} options={ORIGIN_OPTIONS} onChange={(origin) => update({ origin })} />
        <Button variant="ghost" size="sm" className="h-9 sm:ml-auto" onClick={() => update(DEFAULTS)}>
          Reset filters
        </Button>
      </FilterBar>
      {dateInvalid && (
        <p role="alert" className="-mt-3 text-xs text-destructive">
          The “From” date is after the “To” date, so no alerts can match.
        </p>
      )}

      <section aria-label="Anomaly summary" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Matching alerts" value={data ? formatInteger(filtered.length) : '—'} icon={ShieldAlert} isLoading={loading} caption={`of ${formatInteger(all.length)} in range`} />
        <KpiCard label="Active (open or investigating)" value={data ? formatInteger(active.length) : '—'} icon={Zap} tone="amber" isLoading={loading} />
        <KpiCard label="Critical" value={data ? formatInteger(critical.length) : '—'} icon={ShieldAlert} tone="red" isLoading={loading} />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="By anomaly type"
          description="Matching alerts"
          isLoading={loading}
          error={error}
          onRetry={() => mutate()}
          isEmpty={filtered.length === 0}
        >
          <DonutChart
            centerLabel="alerts"
            data={(Object.keys(ANOMALY_LABELS) as AnomalyType[]).map((t) => ({
              key: t,
              label: ANOMALY_LABELS[t],
              value: filtered.filter((a) => a.anomaly_type === t).length,
              color: ANOMALY_META[t].color,
            }))}
          />
        </ChartCard>
        <ChartCard
          title="By severity"
          description="Matching alerts"
          isLoading={loading}
          error={error}
          onRetry={() => mutate()}
          isEmpty={filtered.length === 0}
        >
          <BarComparisonChart
            data={bySeverity}
            categoryKey="severity"
            series={[{ key: 'count', label: 'Alerts', color: 'var(--chart-1)' }]}
            colorFor={(row) => SEVERITY_COLOR[row.key]}
            className="h-52"
            categoryWidth={80}
          />
        </ChartCard>
      </div>

      <ChartCard
        title="Anomaly list"
        description="Select a row for details. Newest first."
        isLoading={loading}
        error={error}
        onRetry={() => mutate()}
        isEmpty={filtered.length === 0}
        emptyTitle={filters.origin === 'detected' ? 'No detected anomalies yet' : 'No anomalies match these filters'}
        emptyDescription={
          filters.origin === 'detected'
            ? 'The Spark detection job and backend API are not connected, so there are no real detected anomalies to show.'
            : 'Try widening the date range or clearing a filter.'
        }
        contentClassName="px-0"
        footer={
          <span>
            Showing {Math.min(visible, filtered.length)} of {filtered.length} alerts.
          </span>
        }
      >
        <div className="px-1">
          <AlertsTable alerts={filtered.slice(0, visible)} onSelect={setSelected} caption="Anomaly alerts" />
          {filtered.length > visible && (
            <div className="flex justify-center py-3">
              <Button variant="outline" size="sm" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                Show {Math.min(PAGE_SIZE, filtered.length - visible)} more
              </Button>
            </div>
          )}
        </div>
      </ChartCard>

      <AlertDetailsSheet alert={selected} onClose={() => setSelected(null)} />
    </>
  )
}
