'use client'

import { Activity, CalendarDays, Gauge, Zap } from 'lucide-react'
import { BarComparisonChart, HourlyProfileChart } from '@/components/charts/energy-charts'
import { ChartCard } from '@/components/shared/chart-card'
import { KpiCard } from '@/components/shared/kpi-card'
import { PageHeader } from '@/components/shared/page-header'
import { useCustomerUsage } from '@/hooks/use-platform-data'
import { formatDate, formatNumber, formatPercent } from '@/lib/format'

export function MyUsageView() {
  const { data, error, isLoading, mutate } = useCustomerUsage()
  const loading = isLoading && !data
  const change =
    data && data.previous_month_kwh > 0 ? ((data.month_to_date_kwh - data.previous_month_kwh) / data.previous_month_kwh) * 100 : undefined

  return (
    <>
      <PageHeader
        title="My usage"
        description={data ? `Meter ${data.meter_id} · ${data.region} region · ${data.tariff}` : 'Your own meter consumption.'}
      />

      <section aria-label="Usage summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Month to date"
          value={data ? formatNumber(data.month_to_date_kwh, 1) : '—'}
          unit="kWh"
          icon={Zap}
          isLoading={loading}
          caption={data ? `Last month: ${formatNumber(data.previous_month_kwh, 0)} kWh (full month)` : undefined}
        />
        <KpiCard
          label="Average per day"
          value={data ? formatNumber(data.avg_daily_kwh, 1) : '—'}
          unit="kWh"
          icon={CalendarDays}
          tone="teal"
          isLoading={loading}
        />
        <KpiCard label="Peak demand" value={data ? formatNumber(data.peak_kw, 2) : '—'} unit="kW" icon={Gauge} tone="cyan" isLoading={loading} />
        <KpiCard
          label="Month-to-date vs. last month"
          value={change === undefined ? '—' : formatPercent(change)}
          icon={Activity}
          tone="amber"
          isLoading={loading}
          caption="Partial month vs. full month"
        />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Daily consumption"
          description="Energy (kWh) per day this month"
          isLoading={loading}
          error={error}
          onRetry={() => mutate()}
          isEmpty={!data || data.daily.length === 0}
          emptyTitle="No usage data"
          emptyDescription="No readings are available for your meter yet."
        >
          <BarComparisonChart
            data={(data?.daily ?? []).map((d) => ({ ...d, label: formatDate(d.date) }))}
            categoryKey="label"
            layout="horizontal"
            valueFormatter={(v) => formatNumber(v, 0)}
            series={[{ key: 'energy_kwh', label: 'Energy', color: 'var(--chart-1)', unit: 'kWh' }]}
            digits={1}
          />
        </ChartCard>
        <ChartCard
          title="Typical day"
          description="Average vs. peak power by hour (kW), last 30 days"
          isLoading={loading}
          error={error}
          onRetry={() => mutate()}
          isEmpty={!data || data.hourly_profile.length === 0}
          emptyTitle="No usage data"
        >
          <HourlyProfileChart data={data?.hourly_profile ?? []} />
        </ChartCard>
      </div>
    </>
  )
}
