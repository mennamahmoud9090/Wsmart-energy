'use client'

import { Fragment } from 'react'
import {
  ArrowDown,
  ArrowRight,
  Boxes,
  Cloud,
  Database,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  Server,
  Share2,
  Workflow,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { DemoOnlyBadge } from '@/components/shared/simulated-badge'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { referenceData } from '@/lib/api/energy-service'
import { appConfig, gridThresholds, isApiConfigured } from '@/lib/config'
import { endpoints } from '@/lib/api/endpoints'
import { formatDateTime, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

type StageStatus = 'in-app' | 'planned'

interface Stage {
  name: string
  tech: string
  icon: LucideIcon
  role: string
  status: StageStatus
}

const STAGES: Stage[] = [
  { name: 'Data generator', tech: 'Python', icon: FlaskConical, role: 'Produces synthetic 15-minute smart meter readings (kW, kVAr, V, kWh) with injected anomalies.', status: 'planned' },
  { name: 'Streaming ingest', tech: 'Apache Kafka', icon: Share2, role: 'Buffers meter readings as a durable event stream, partitioned by meter or region.', status: 'planned' },
  { name: 'Processing', tech: 'Apache Spark', icon: Zap, role: 'Cleans, aggregates and runs anomaly detection over the stream and in batch.', status: 'planned' },
  { name: 'Data lake', tech: 'MinIO · Parquet / Iceberg', icon: Boxes, role: 'Stores raw and curated tables as Parquet, optionally managed as Iceberg tables.', status: 'planned' },
  { name: 'Data warehouse', tech: 'Snowflake', icon: Database, role: 'Serves modelled facts and aggregates for analytics and reporting.', status: 'planned' },
  { name: 'Backend API', tech: 'FastAPI (proposed)', icon: Server, role: 'Authenticates users and queries Snowflake with server-side credentials; the browser never connects to Snowflake.', status: 'planned' },
  { name: 'Dashboard', tech: 'Next.js (this app)', icon: LayoutDashboard, role: 'Presents KPIs, analytics, grid health, anomalies and reports. Currently runs on simulated data.', status: 'in-app' },
]

const ENDPOINT_ROWS: { method: string; path: string; purpose: string }[] = [
  { method: 'GET', path: endpoints.dashboard, purpose: 'Dashboard KPIs, trend, hourly profile, regional split' },
  { method: 'GET', path: endpoints.consumption, purpose: 'Energy consumption time series and by-location totals' },
  { method: 'GET', path: endpoints.meterComparison, purpose: 'Per-meter energy and demand comparison' },
  { method: 'GET', path: endpoints.grid, purpose: 'Transformer health, voltage series, regional grid summary' },
  { method: 'GET', path: endpoints.alerts, purpose: 'Anomaly records (with origin: simulated or detected)' },
  { method: 'PATCH', path: '/v1/anomalies/alerts/{id}/status', purpose: 'Update an alert status (audited)' },
  { method: 'GET', path: endpoints.reports, purpose: 'Report catalog' },
  { method: 'GET', path: endpoints.customerUsage, purpose: 'Usage of the signed-in customer’s own meter' },
  { method: 'GET', path: endpoints.users, purpose: 'User administration (admin only)' },
  { method: 'POST', path: `${endpoints.login} · ${endpoints.logout}`, purpose: 'Session login / logout with an HttpOnly cookie' },
]

function StageCard({ stage, index }: { stage: Stage; index: number }) {
  const Icon = stage.icon
  const live = stage.status === 'in-app'
  return (
    <li
      className={cn(
        'flex h-full flex-col gap-2 rounded-xl border bg-card p-4 shadow-xs',
        live ? 'border-teal/50' : 'border-border border-dashed',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn('flex size-8 items-center justify-center rounded-lg', live ? 'bg-teal/10 text-teal' : 'bg-muted text-muted-foreground')}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="tabular text-[11px] text-muted-foreground">Step {index + 1}</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{stage.name}</p>
        <p className="text-xs font-medium text-teal">{stage.tech}</p>
      </div>
      <p className="flex-1 text-xs leading-relaxed text-muted-foreground">{stage.role}</p>
      <span
        className={cn(
          'w-fit rounded-full px-2 py-0.5 text-[11px] font-medium',
          live ? 'bg-teal/10 text-teal' : 'bg-muted text-muted-foreground',
        )}
      >
        {live ? 'Implemented · demo data' : 'Not connected to this UI'}
      </span>
    </li>
  )
}

export function SystemView() {
  const samples = referenceData.sampleReadings()

  return (
    <>
      <PageHeader
        title="System overview"
        description="Target data pipeline and how this dashboard will connect to it."
        simulated={false}
      />

      <Card className="gap-4 shadow-xs ring-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Data pipeline architecture</CardTitle>
          <CardDescription className="text-xs">
            Dashed cards are planned or external components that are not wired to this front end yet. Solid card is what this repository contains.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ol aria-label="Pipeline stages" className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-7">
            {STAGES.map((stage, i) => (
              <Fragment key={stage.name}>
                <StageCard stage={stage} index={i} />
              </Fragment>
            ))}
          </ol>
          <div className="hidden items-center justify-center gap-2 text-xs text-muted-foreground xl:flex" aria-hidden="true">
            {STAGES.slice(0, -1).map((s) => (
              <ArrowRight key={s.name} className="size-3.5" />
            ))}
            <span>data flow, left to right</span>
          </div>
          <div className="flex items-center justify-center text-muted-foreground xl:hidden" aria-hidden="true">
            <ArrowDown className="size-4" />
            <span className="ml-1 text-xs">data flows in step order</span>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-muted/40 p-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Workflow className="size-4" aria-hidden="true" />
            </span>
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Apache Airflow (optional)</span> orchestrates scheduled work across the pipeline: batch Spark jobs,
              Iceberg maintenance, Snowflake loads, and data-quality checks.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="gap-4 shadow-xs ring-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Cloud className="size-4 text-teal" aria-hidden="true" />
              Current runtime configuration
            </CardTitle>
            <CardDescription className="text-xs">Read from public environment variables; no secrets are used in the browser.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border text-sm">
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-muted-foreground">Data source</dt>
                <dd className="font-medium text-foreground">{appConfig.dataSource === 'mock' ? 'Simulated (mock)' : 'Backend API'}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-muted-foreground">API base URL</dt>
                <dd className="font-mono text-xs text-foreground">{appConfig.apiBaseUrl || 'not set'}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-muted-foreground">API mode active</dt>
                <dd className="font-medium text-foreground">{isApiConfigured ? 'Yes' : 'No'}</dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-muted-foreground">Transformer warning / overload</dt>
                <dd className="tabular font-medium text-foreground">
                  {gridThresholds.transformerWarningPct}% / {gridThresholds.transformerOverloadPct}%
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-muted-foreground">Nominal voltage / tolerance</dt>
                <dd className="tabular font-medium text-foreground">
                  {gridThresholds.nominalVoltageV} V / ±{gridThresholds.voltageTolerancePct}%
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="gap-4 shadow-xs ring-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Gauge className="size-4 text-teal" aria-hidden="true" />
              Auth and access
            </CardTitle>
            <CardDescription className="text-xs">What is real and what is placeholder in this build.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-xs leading-relaxed text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Login is demo-only.</span> Any valid email and an 8+ character password sign in for the chosen role; the
              session lives in sessionStorage.
            </p>
            <p>
              <span className="font-medium text-foreground">Role gating is cosmetic.</span> It hides navigation in the UI. Real authorization must be enforced by the
              backend on every request.
            </p>
            <p>
              <span className="font-medium text-foreground">Warehouse access is server-side only.</span> Snowflake credentials belong in the backend’s environment, never in
              NEXT_PUBLIC_ variables or browser code.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="gap-4 shadow-xs ring-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Canonical meter reading record</CardTitle>
          <CardDescription className="text-xs">
            Sample rows from the synthetic generator, showing the schema the pipeline is expected to produce. <DemoOnlyBadge label="Simulated sample" />
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="px-1">
            <Table>
              <caption className="sr-only">Sample meter readings</caption>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">meter_id</TableHead>
                  <TableHead className="text-xs">timestamp</TableHead>
                  <TableHead className="text-xs">region</TableHead>
                  <TableHead className="text-xs">meter_type</TableHead>
                  <TableHead className="text-xs">transformer_id</TableHead>
                  <TableHead className="text-right text-xs">active_power_kw</TableHead>
                  <TableHead className="text-right text-xs">reactive_power_kvar</TableHead>
                  <TableHead className="text-right text-xs">voltage_v</TableHead>
                  <TableHead className="text-right text-xs">energy_kwh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {samples.map((r) => (
                  <TableRow key={r.meter_id}>
                    <TableCell className="font-mono text-xs">{r.meter_id}</TableCell>
                    <TableCell className="tabular text-xs whitespace-nowrap">{formatDateTime(r.timestamp)}</TableCell>
                    <TableCell className="text-xs">{r.region}</TableCell>
                    <TableCell className="text-xs">{r.meter_type}</TableCell>
                    <TableCell className="font-mono text-xs">{r.transformer_id}</TableCell>
                    <TableCell className="tabular text-right text-xs">{formatNumber(r.active_power_kw, 3)}</TableCell>
                    <TableCell className="tabular text-right text-xs">{formatNumber(r.reactive_power_kvar, 3)}</TableCell>
                    <TableCell className="tabular text-right text-xs">{formatNumber(r.voltage_v, 1)}</TableCell>
                    <TableCell className="tabular text-right text-xs">{formatNumber(r.energy_kwh, 3)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-4 shadow-xs ring-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Backend API contract</CardTitle>
          <CardDescription className="text-xs">
            None of these endpoints are implemented yet. They are the proposed contract the front end calls when NEXT_PUBLIC_DATA_SOURCE=api. See docs/API_CONTRACT.md.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="px-1">
            <Table>
              <caption className="sr-only">Proposed API endpoints</caption>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Method</TableHead>
                  <TableHead className="text-xs">Path</TableHead>
                  <TableHead className="text-xs">Purpose</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ENDPOINT_ROWS.map((e) => (
                  <TableRow key={e.path}>
                    <TableCell className="font-mono text-xs font-medium">{e.method}</TableCell>
                    <TableCell className="font-mono text-xs">{e.path}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.purpose}</TableCell>
                    <TableCell>
                      <DemoOnlyBadge label="Proposed · not implemented" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
