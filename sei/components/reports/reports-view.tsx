'use client'

import Link from 'next/link'
import { useState } from 'react'
import { BarChart3, Calendar, ExternalLink, FileText } from 'lucide-react'
import { ANOMALY_META } from '@/components/alerts/alerts-table'
import { useAuth } from '@/components/auth/auth-provider'
import { BarComparisonChart, DonutChart, TimeSeriesChart } from '@/components/charts/energy-charts'
import { ChartCard } from '@/components/shared/chart-card'
import { DemoOnlyBadge } from '@/components/shared/simulated-badge'
import { ExportCsvButton } from '@/components/shared/export-csv-button'
import { FilterBar, FilterSelect } from '@/components/shared/filter-select'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDashboard, useReports } from '@/hooks/use-platform-data'
import { appConfig } from '@/lib/config'
import { hasPermission } from '@/lib/auth/roles'
import { RANGE_OPTIONS } from '@/lib/filter-options'
import { ANOMALY_LABELS, formatCompact, formatDate, formatEnergy, formatInteger, formatNumber, formatTime } from '@/lib/format'
import type { DashboardFilters, DateRange, ReportCategory } from '@/lib/types'

const CATEGORY_LABEL: Record<ReportCategory, string> = {
  consumption: 'Consumption',
  grid: 'Grid',
  anomaly: 'Anomaly',
  customer: 'Customer',
}

export function ReportsView() {
  const { session } = useAuth()
  const [range, setRange] = useState<DateRange>('30d')
  const canSeeFleet = session ? hasPermission(session.role, 'consumption.fleet.read') : false
  const filters: DashboardFilters = { range, region: 'all', meterType: 'all' }

  const reports = useReports()
  // Fleet-wide summaries are only requested for roles that may see fleet data.
  const dashboard = useDashboard(filters, canSeeFleet)
  const data = dashboard.data
  const loading = dashboard.isLoading && !dashboard.data

  const catalog = (reports.data ?? []).filter((r) => (session ? r.audience.includes(session.role) : false))
  const regions = data?.by_location ?? []
  const totalEnergy = regions.reduce((s, r) => s + r.energy_kwh, 0)
  const anomalies = (data?.anomaly_distribution ?? []).map((d) => ({ ...d, label: ANOMALY_LABELS[d.anomaly_type] }))
  const xFormatter = range === '24h' ? formatTime : formatDate

  return (
    <>
      <PageHeader
        title="Reports"
        description="Summary tables with CSV export, plus the catalog of reports planned for Power BI."
      />

      {canSeeFleet && (
        <>
          <FilterBar>
            <FilterSelect label="Date range" icon={Calendar} value={range} options={RANGE_OPTIONS} onChange={setRange} />
          </FilterBar>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <ChartCard
              className="xl:col-span-2"
              title="Energy consumption trend"
              description="Fleet-wide energy (kWh)"
              isLoading={loading}
              error={dashboard.error}
              onRetry={() => dashboard.mutate()}
              isEmpty={(data?.trend.length ?? 0) === 0}
              action={
                <ExportCsvButton
                  filename={`energy-trend-${range}.csv`}
                  headers={['timestamp', 'energy_kwh', 'avg_active_power_kw', 'avg_reactive_power_kvar']}
                  rows={(data?.trend ?? []).map((p) => [p.timestamp, p.energy_kwh, p.active_power_kw, p.reactive_power_kvar])}
                />
              }
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
              title="Anomalies by type"
              description="All statuses, selected period"
              isLoading={loading}
              error={dashboard.error}
              onRetry={() => dashboard.mutate()}
              isEmpty={anomalies.every((a) => a.count === 0)}
            >
              <DonutChart
                centerLabel="anomalies"
                data={anomalies.map((a) => ({ key: a.anomaly_type, label: a.label, value: a.count, color: ANOMALY_META[a.anomaly_type].color }))}
              />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ChartCard
              title="Consumption by region"
              description="Summary table"
              isLoading={loading}
              error={dashboard.error}
              onRetry={() => dashboard.mutate()}
              isEmpty={regions.length === 0}
              contentClassName="px-0"
              action={
                <ExportCsvButton
                  filename={`consumption-by-region-${range}.csv`}
                  headers={['region', 'energy_kwh', 'share_pct', 'meters', 'avg_kwh_per_meter']}
                  rows={regions.map((r) => [r.location, r.energy_kwh, totalEnergy ? (r.energy_kwh / totalEnergy) * 100 : 0, r.meters, r.avg_active_power_kw])}
                />
              }
            >
              <div className="px-1">
                <Table>
                  <caption className="sr-only">Consumption by region</caption>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs">Region</TableHead>
                      <TableHead className="text-right text-xs">Energy</TableHead>
                      <TableHead className="text-right text-xs">Share</TableHead>
                      <TableHead className="text-right text-xs">Meters</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {regions.map((r) => (
                      <TableRow key={r.location}>
                        <TableCell className="text-sm font-medium text-foreground">{r.location}</TableCell>
                        <TableCell className="tabular text-right text-sm">{formatEnergy(r.energy_kwh)}</TableCell>
                        <TableCell className="tabular text-right text-sm">
                          {formatNumber(totalEnergy ? (r.energy_kwh / totalEnergy) * 100 : 0, 1)}%
                        </TableCell>
                        <TableCell className="tabular text-right text-sm">{formatInteger(r.meters)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ChartCard>
            <ChartCard
              title="Regional comparison"
              description="Energy (kWh) per region"
              isLoading={loading}
              error={dashboard.error}
              onRetry={() => dashboard.mutate()}
              isEmpty={regions.length === 0}
            >
              <BarComparisonChart
                data={regions}
                categoryKey="location"
                valueFormatter={formatCompact}
                series={[{ key: 'energy_kwh', label: 'Energy', color: 'var(--chart-2)', unit: 'kWh' }]}
                className="h-64"
                categoryWidth={80}
              />
            </ChartCard>
          </div>

          <ChartCard
            title="Recent alerts (export)"
            description="Most recent alerts for the selected period. Use the Anomaly Detection page for the full, filterable list."
            isLoading={loading}
            error={dashboard.error}
            onRetry={() => dashboard.mutate()}
            isEmpty={(data?.recent_alerts.length ?? 0) === 0}
            action={
              <ExportCsvButton
                filename={`recent-alerts-${range}.csv`}
                headers={['alert_id', 'origin', 'timestamp', 'location', 'anomaly_type', 'severity', 'status']}
                rows={(data?.recent_alerts ?? []).map((a) => [a.alert_id, a.origin, a.timestamp, a.location, a.anomaly_type, a.severity, a.status])}
              />
            }
          >
            <p className="text-sm text-muted-foreground">
              {data?.recent_alerts.length ?? 0} alerts are included in this export.{' '}
              <Link href="/anomalies" className="font-medium text-foreground underline underline-offset-4">
                Open Anomaly Detection
              </Link>{' '}
              to filter and export the complete list.
            </p>
          </ChartCard>
        </>
      )}

      <section aria-label="Report catalog" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Report catalog</h2>
            <p className="text-xs text-muted-foreground">
              Power BI reports are not published yet; these entries document what will be connected through the backend.
            </p>
          </div>
          <DemoOnlyBadge label="Power BI not connected" />
        </div>
        {reports.error ? (
          <p role="alert" className="text-sm text-destructive">
            Unable to load the report catalog.{' '}
            <button className="underline" onClick={() => reports.mutate()}>
              Retry
            </button>
          </p>
        ) : catalog.length === 0 ? (
          <p className="text-sm text-muted-foreground">{reports.isLoading ? 'Loading reports…' : 'No reports are available for your role.'}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {catalog.map((r) => (
              <Card key={r.report_id} className="gap-3 shadow-xs ring-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <FileText className="size-4 text-teal" aria-hidden="true" />
                    {r.title}
                  </CardTitle>
                  <CardDescription className="text-xs">{r.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <dl className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Category</dt>
                      <dd className="font-medium text-foreground">{CATEGORY_LABEL[r.category]}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Refresh</dt>
                      <dd className="font-medium text-foreground">{r.refresh_cadence}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{r.highlight.label}</dt>
                      <dd className="font-medium text-foreground">{r.highlight.value}</dd>
                    </div>
                  </dl>
                  {r.powerbi_report_id && appConfig.powerBiWorkspaceUrl ? (
                    <Button variant="outline" size="sm" render={<a href={appConfig.powerBiWorkspaceUrl} target="_blank" rel="noreferrer" />}>
                      <ExternalLink data-icon="inline-start" aria-hidden="true" />
                      Open in Power BI
                    </Button>
                  ) : r.category === 'customer' && session?.role === 'customer' ? (
                    <Button variant="outline" size="sm" render={<Link href="/my-usage" />}>
                      <BarChart3 data-icon="inline-start" aria-hidden="true" />
                      View my usage
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      Not published yet
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
