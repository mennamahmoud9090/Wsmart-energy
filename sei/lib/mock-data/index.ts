/**
 * SIMULATED DATA — the single source of synthetic data for the prototype.
 *
 * Every value produced here is generated from a deterministic load model and
 * must never be presented as a real electricity measurement. The data-access
 * layer (lib/api/energy-service.ts) is the only consumer; UI components never
 * import this module directly, so it can be swapped for real API calls.
 */
import type {
  Alert,
  AlertQuery,
  AlertStatus,
  AnomalyType,
  ConsumptionData,
  ConsumptionPoint,
  ConsumptionQuery,
  CustomerUsage,
  DashboardData,
  DashboardFilters,
  DateRange,
  GridData,
  GridQuery,
  HourlyProfilePoint,
  LocationConsumption,
  MeterComparisonQuery,
  MeterComparisonRow,
  MeterReading,
  PlatformUser,
  Region,
  RegionGridSummary,
  ReportDefinition,
  Severity,
  Transformer,
  VoltagePoint,
} from '@/lib/types'
import { gridThresholds } from '@/lib/config'
import {
  CUSTOMER_METER_ID,
  FLEET,
  METER_TYPES,
  REGIONS,
  REGION_CODES,
  SAMPLE_METERS,
  SIMULATION_ANCHOR,
  SITES,
  TRANSFORMERS_PER_SITE,
  getTotalMeters,
  transformerIdFor,
} from './catalog'
import {
  activePowerKw,
  createRng,
  dailyAggregate,
  noise,
  reactivePowerKvar,
  round,
  scopeFrom,
  startOfUtcDay,
  type Scope,
} from './load-model'

export { SAMPLE_METERS, REGIONS, METER_TYPES, SITES, SIMULATION_ANCHOR, CUSTOMER_METER_ID }

const HOUR = 3_600_000
const DAY = 24 * HOUR

const RANGE_DAYS: Record<DateRange, number> = { '24h': 1, '7d': 7, '30d': 30, '90d': 90 }

function rangeStart(range: DateRange) {
  return new Date(SIMULATION_ANCHOR.getTime() - RANGE_DAYS[range] * DAY)
}

/* ------------------------------------------------------------------ */
/* Time series                                                          */
/* ------------------------------------------------------------------ */

function trendFor(scope: Scope, range: DateRange, seed: string): ConsumptionPoint[] {
  const points: ConsumptionPoint[] = []
  if (range === '24h' || range === '7d') {
    const stepMs = range === '24h' ? 15 * 60_000 : HOUR
    const count = range === '24h' ? 96 : 168
    const hours = stepMs / HOUR
    for (let i = count - 1; i >= 0; i--) {
      const ts = new Date(SIMULATION_ANCHOR.getTime() - i * stepMs)
      const kw = activePowerKw(scope, ts, seed)
      points.push({
        timestamp: ts.toISOString(),
        active_power_kw: round(kw),
        reactive_power_kvar: round(reactivePowerKvar(kw, scope)),
        energy_kwh: round(kw * hours),
      })
    }
    return points
  }
  const days = RANGE_DAYS[range]
  const today = startOfUtcDay(SIMULATION_ANCHOR)
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today.getTime() - i * DAY)
    const agg = dailyAggregate(scope, day, seed)
    points.push({
      timestamp: day.toISOString(),
      active_power_kw: round(agg.avg),
      reactive_power_kvar: round(reactivePowerKvar(agg.avg, scope)),
      energy_kwh: round(agg.energy),
    })
  }
  return points
}

function hourlyProfileFor(scope: Scope, range: DateRange, seed: string): HourlyProfilePoint[] {
  const sampleDays = Math.min(RANGE_DAYS[range], 14)
  const today = startOfUtcDay(SIMULATION_ANCHOR)
  return Array.from({ length: 24 }, (_, hour) => {
    let sum = 0
    let peak = 0
    for (let d = 0; d < sampleDays; d++) {
      const kw = activePowerKw(scope, new Date(today.getTime() - d * DAY + hour * HOUR), seed)
      sum += kw
      peak = Math.max(peak, kw)
    }
    return {
      hour,
      avg_active_power_kw: round(sum / sampleDays),
      peak_active_power_kw: round(peak),
    }
  })
}

function locationBreakdown(
  region: Region | 'all',
  meterType: DashboardFilters['meterType'],
  totalEnergyKwh: number,
  groupBy: 'region' | 'site',
): LocationConsumption[] {
  const types = meterType === 'all' ? METER_TYPES : [meterType]
  const regions = region === 'all' ? REGIONS : [region]
  const totalMeters = getTotalMeters(region, meterType)

  if (groupBy === 'region') {
    return regions.map((r) => {
      const meters = types.reduce((s, t) => s + FLEET[r][t], 0)
      const share = (meters / totalMeters) * (1 + noise(`loc|${r}`) * 0.06)
      const energy = totalEnergyKwh * share
      return {
        location: r,
        region: r,
        energy_kwh: round(energy),
        meters,
        avg_active_power_kw: round(energy / Math.max(meters, 1), 2),
      }
    })
  }

  return SITES.filter((s) => regions.includes(s.region)).map((site) => {
    const regionMeters = types.reduce((s, t) => s + FLEET[site.region][t], 0)
    const meters = Math.round(regionMeters * site.share)
    const share = (meters / totalMeters) * (1 + noise(`site|${site.name}`) * 0.08)
    const energy = totalEnergyKwh * share
    return {
      location: site.name,
      region: site.region,
      energy_kwh: round(energy),
      meters,
      avg_active_power_kw: round(energy / Math.max(meters, 1), 2),
    }
  })
}

/* ------------------------------------------------------------------ */
/* Alerts                                                               */
/* ------------------------------------------------------------------ */

const ANOMALY_WEIGHTS: [AnomalyType, number][] = [
  ['transformer_load_surge', 0.3],
  ['persistent_voltage_drop', 0.34],
  ['irregular_consumption_pattern', 0.36],
]
const SEVERITY_WEIGHTS: [Severity, number][] = [
  ['low', 0.34],
  ['medium', 0.33],
  ['high', 0.23],
  ['critical', 0.1],
]

function pick<T>(rng: () => number, weighted: [T, number][]) {
  const r = rng()
  let acc = 0
  for (const [value, w] of weighted) {
    acc += w
    if (r <= acc) return value
  }
  return weighted[weighted.length - 1][0]
}

function describe(type: AnomalyType, observed: number, expected: number, unit: string) {
  switch (type) {
    case 'transformer_load_surge':
      return `Transformer loading reached ${observed}${unit} against a demo threshold of ${expected}${unit} for consecutive 15-minute intervals.`
    case 'persistent_voltage_drop':
      return `Supply voltage averaged ${observed} ${unit} across 4+ intervals, below the configured lower band (nominal ${expected} ${unit}).`
    case 'irregular_consumption_pattern':
      return `Interval energy of ${observed} ${unit} deviates strongly from the meter's rolling baseline of ${expected} ${unit}.`
  }
}

function generateAlerts(): Alert[] {
  const rng = createRng('alerts-v1')
  const alerts: Alert[] = []
  for (let i = 0; i < 260; i++) {
    const site = SITES[Math.floor(rng() * SITES.length)]
    const type = pick(rng, ANOMALY_WEIGHTS)
    const severity = pick(rng, SEVERITY_WEIGHTS)
    const severityBoost = { low: 0, medium: 0.25, high: 0.55, critical: 1 }[severity]
    const meterType = pick(rng, [
      ['residential', 0.62],
      ['commercial', 0.24],
      ['industrial', 0.14],
    ] as [Alert['meter_type'], number][])
    const ageMs = Math.pow(rng(), 1.6) * 90 * DAY
    const ts = new Date(Math.floor((SIMULATION_ANCHOR.getTime() - ageMs) / (15 * 60_000)) * 15 * 60_000)
    const transformer_id = transformerIdFor(site, Math.floor(rng() * TRANSFORMERS_PER_SITE))
    const meter_id = `MTR-${REGION_CODES[site.region]}-${String(Math.floor(rng() * 24_000)).padStart(6, '0')}`

    let observed: number
    let expected: number
    let unit: string
    if (type === 'transformer_load_surge') {
      expected = gridThresholds.transformerOverloadPct
      observed = round(expected + 3 + severityBoost * 30 + rng() * 6)
      unit = '%'
    } else if (type === 'persistent_voltage_drop') {
      expected = gridThresholds.nominalVoltageV
      observed = round(205 - severityBoost * 14 - rng() * 3)
      unit = 'V'
    } else {
      expected = round(0.25 + rng() * 0.4, 2)
      observed = round(expected * (3 + severityBoost * 9 + rng() * 2), 2)
      unit = 'kWh/15min'
    }

    const ageDays = ageMs / DAY
    const statusRoll = rng()
    let status: AlertStatus
    if (ageDays < 2) status = statusRoll < 0.65 ? 'open' : 'investigating'
    else if (ageDays < 10) status = statusRoll < 0.3 ? 'open' : statusRoll < 0.6 ? 'investigating' : 'resolved'
    else status = statusRoll < 0.82 ? 'resolved' : statusRoll < 0.92 ? 'dismissed' : 'investigating'

    alerts.push({
      alert_id: `ALR-${String(48_210 + i).padStart(6, '0')}`,
      meter_id,
      transformer_id,
      region: site.region,
      meter_type: meterType,
      location: site.name,
      timestamp: ts.toISOString(),
      anomaly_type: type,
      severity,
      observed_value: observed,
      expected_value: expected,
      unit,
      status,
      origin: 'simulated',
      description: describe(type, observed, expected, unit),
    })
  }
  return alerts.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

const BASE_ALERTS = generateAlerts()
/** In-memory status overrides so demo status changes persist for the session. */
const statusOverrides = new Map<string, AlertStatus>()

function allAlerts() {
  return BASE_ALERTS.map((a) =>
    statusOverrides.has(a.alert_id) ? { ...a, status: statusOverrides.get(a.alert_id)! } : a,
  )
}

export function mockAlerts(query: AlertQuery & { meterType?: DashboardFilters['meterType'] }) {
  const start = rangeStart(query.range).toISOString()
  return allAlerts().filter(
    (a) =>
      a.timestamp >= start &&
      (query.region === 'all' || a.region === query.region) &&
      (!query.meterType || query.meterType === 'all' || a.meter_type === query.meterType),
  )
}

export function mockUpdateAlertStatus(alertId: string, status: AlertStatus) {
  const alert = BASE_ALERTS.find((a) => a.alert_id === alertId)
  if (!alert) throw new Error(`Alert ${alertId} not found`)
  statusOverrides.set(alertId, status)
  return { ...alert, status }
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                            */
/* ------------------------------------------------------------------ */

export function mockDashboard(filters: DashboardFilters): DashboardData {
  const scope = scopeFrom(filters.region, filters.meterType)
  const seed = `dash|${filters.range}`
  const trend = trendFor(scope, filters.range, seed)
  const total = trend.reduce((s, p) => s + p.energy_kwh, 0)
  const avg = trend.reduce((s, p) => s + p.active_power_kw, 0) / trend.length
  const hourly = hourlyProfileFor(scope, filters.range, seed)
  const peakPoint = hourly.reduce((m, p) => (p.peak_active_power_kw > m.peak_active_power_kw ? p : m))
  const peakDate = new Date(startOfUtcDay(SIMULATION_ANCHOR).getTime() + peakPoint.hour * HOUR)

  const alerts = mockAlerts({ region: filters.region, range: filters.range, meterType: filters.meterType })
  const active = alerts.filter((a) => a.status === 'open' || a.status === 'investigating')
  const totalMeters = getTotalMeters(filters.region, filters.meterType)
  const k = `${filters.region}|${filters.meterType}|${filters.range}`

  return {
    kpis: {
      total_energy_kwh: { value: round(total), change_pct: round(2.4 + noise(`e|${k}`) * 4) },
      avg_active_power_kw: { value: round(avg), change_pct: round(1.6 + noise(`a|${k}`) * 3.5) },
      peak_demand_kw: {
        value: peakPoint.peak_active_power_kw,
        change_pct: round(3.1 + noise(`p|${k}`) * 4),
        peak_timestamp: peakDate.toISOString(),
      },
      active_meters: {
        value: Math.round(totalMeters * (0.986 + noise(`m|${k}`) * 0.006)),
        total_meters: totalMeters,
        change_pct: round(0.3 + noise(`mc|${k}`) * 0.4),
      },
      anomalies_detected: {
        value: active.length,
        total: alerts.length,
        critical: active.filter((a) => a.severity === 'critical').length,
        change_pct: round(-4 + noise(`an|${k}`) * 9),
      },
    },
    trend,
    hourly_profile: hourly,
    by_location: locationBreakdown(filters.region, filters.meterType, total, filters.region === 'all' ? 'region' : 'site'),
    anomaly_distribution: ANOMALY_WEIGHTS.map(([type]) => ({
      anomaly_type: type,
      count: alerts.filter((a) => a.anomaly_type === type).length,
    })),
    recent_alerts: alerts.slice(0, 6),
  }
}

/* ------------------------------------------------------------------ */
/* Consumption                                                          */
/* ------------------------------------------------------------------ */

function scopeForQuery(query: ConsumptionQuery): Scope {
  if (query.meterId !== 'all') {
    const meter = SAMPLE_METERS.find((m) => m.meter_id === query.meterId)
    if (meter) return { regions: [meter.region], types: [meter.meter_type], meterCount: 1 }
  }
  return scopeFrom(query.region, 'all')
}

export function mockConsumption(query: ConsumptionQuery): ConsumptionData {
  const scope = scopeForQuery(query)
  const seed = `cons|${query.meterId}`
  const today = startOfUtcDay(SIMULATION_ANCHOR)
  const series: ConsumptionPoint[] = []
  let peak = 0

  const pushBucket = (start: Date, days: number) => {
    let energy = 0
    for (let d = 0; d < days; d++) {
      const agg = dailyAggregate(scope, new Date(start.getTime() + d * DAY), seed)
      energy += agg.energy
      peak = Math.max(peak, agg.peak)
    }
    const avg = energy / (days * 24)
    series.push({
      timestamp: start.toISOString(),
      energy_kwh: round(energy, 2),
      active_power_kw: round(avg, 2),
      reactive_power_kvar: round(reactivePowerKvar(avg, scope), 2),
    })
  }

  if (query.granularity === 'daily') {
    for (let i = query.periods - 1; i >= 0; i--) pushBucket(new Date(today.getTime() - i * DAY), 1)
  } else if (query.granularity === 'weekly') {
    for (let i = query.periods - 1; i >= 0; i--) pushBucket(new Date(today.getTime() - (i * 7 + 6) * DAY), 7)
  } else {
    for (let i = query.periods - 1; i >= 0; i--) {
      const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1))
      const end =
        i === 0
          ? new Date(today.getTime() + DAY)
          : new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1))
      pushBucket(start, Math.round((end.getTime() - start.getTime()) / DAY))
    }
  }

  const totalEnergy = series.reduce((s, p) => s + p.energy_kwh, 0)
  const avgKw = series.reduce((s, p) => s + p.active_power_kw, 0) / Math.max(series.length, 1)

  return {
    series,
    by_location:
      query.meterId === 'all'
        ? locationBreakdown(query.region, 'all', totalEnergy, 'site').sort((a, b) => b.energy_kwh - a.energy_kwh)
        : [],
    totals: {
      energy_kwh: round(totalEnergy, 2),
      avg_active_power_kw: round(avgKw, 2),
      peak_active_power_kw: round(peak, 2),
    },
  }
}

export function mockMeterComparison(query: MeterComparisonQuery): MeterComparisonRow[] {
  return SAMPLE_METERS.map((meter) => {
    const { totals } = mockConsumption({
      granularity: query.granularity,
      periods: query.periods,
      region: meter.region,
      meterId: meter.meter_id,
    })
    return {
      meter_id: meter.meter_id,
      site: meter.site,
      region: meter.region,
      meter_type: meter.meter_type,
      energy_kwh: totals.energy_kwh,
      avg_active_power_kw: totals.avg_active_power_kw,
      peak_active_power_kw: totals.peak_active_power_kw,
    }
  })
}

/* ------------------------------------------------------------------ */
/* Grid & transformers                                                  */
/* ------------------------------------------------------------------ */

const RATINGS = [500, 750, 1000, 1500]

function generateTransformers(range: DateRange): Transformer[] {
  const rng = createRng('transformers-v1')
  const rangeFactor = { '24h': 1, '7d': 1.02, '30d': 1.035, '90d': 1.05 }[range]
  const list: Transformer[] = []
  SITES.forEach((site) => {
    const regionMeters = METER_TYPES.reduce((s, t) => s + FLEET[site.region][t], 0)
    for (let i = 0; i < TRANSFORMERS_PER_SITE; i++) {
      const rated = RATINGS[Math.floor(rng() * RATINGS.length)]
      const hot = rng() < 0.14
      const loading = round((hot ? 93 + rng() * 14 : 46 + rng() * 40) * rangeFactor)
      const load = round((rated * loading) / 100)
      const status: Transformer['status'] =
        loading >= gridThresholds.transformerOverloadPct
          ? 'overloaded'
          : loading >= gridThresholds.transformerWarningPct
            ? 'warning'
            : 'normal'
      list.push({
        transformer_id: transformerIdFor(site, i),
        site: site.name,
        region: site.region,
        rated_capacity_kva: rated,
        current_load_kva: load,
        loading_pct: loading,
        peak_demand_kw: round(load * 0.94 * (1.08 + rng() * 0.12)),
        avg_voltage_v: round(gridThresholds.nominalVoltageV + 4 - loading * 0.11 - rng() * 3),
        connected_meters: Math.round((regionMeters * site.share) / TRANSFORMERS_PER_SITE),
        status,
      })
    }
  })
  return list
}

function voltageSeries(range: DateRange): VoltagePoint[] {
  const stepMs = { '24h': HOUR, '7d': 4 * HOUR, '30d': DAY / 2, '90d': DAY }[range]
  const count = Math.round((RANGE_DAYS[range] * DAY) / stepMs)
  const sag: Record<Region, number> = { North: 7, South: 6, East: 13, West: 5, Central: 9 }
  return Array.from({ length: count }, (_, idx) => {
    const ts = new Date(SIMULATION_ANCHOR.getTime() - (count - 1 - idx) * stepMs)
    const base = gridThresholds.nominalVoltageV + 3
    const point = { timestamp: ts.toISOString() } as VoltagePoint
    for (const region of REGIONS) {
      const load = activePowerKw({ regions: [region], types: ['residential'], meterCount: 1 }, ts) / 1.05
      point[region] = round(base - load * sag[region] + noise(`v|${region}|${ts.toISOString()}`) * 2.2)
    }
    return point
  })
}

export function mockGrid(query: GridQuery): GridData {
  const all = generateTransformers(query.range)
  const transformers = query.region === 'all' ? all : all.filter((t) => t.region === query.region)
  const voltage = voltageSeries(query.range)
  const regions: RegionGridSummary[] = REGIONS.map((region) => {
    const list = all.filter((t) => t.region === region)
    return {
      region,
      transformers: list.length,
      overloaded: list.filter((t) => t.status === 'overloaded').length,
      avg_loading_pct: round(list.reduce((s, t) => s + t.loading_pct, 0) / list.length),
      peak_demand_kw: round(list.reduce((s, t) => s + t.peak_demand_kw, 0)),
      min_voltage_v: round(Math.min(...voltage.map((v) => v[region]))),
    }
  })
  return { transformers, voltage_series: voltage, regions }
}

/* ------------------------------------------------------------------ */
/* Customer, reports, users                                             */
/* ------------------------------------------------------------------ */

export function mockCustomerUsage(): CustomerUsage {
  const meter = SAMPLE_METERS.find((m) => m.meter_id === CUSTOMER_METER_ID)!
  const scope: Scope = { regions: [meter.region], types: [meter.meter_type], meterCount: 1 }
  const seed = `cust|${meter.meter_id}`
  const today = startOfUtcDay(SIMULATION_ANCHOR)
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
  const prevStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1))
  const daily: CustomerUsage['daily'] = []
  let peak = 0
  for (let t = monthStart.getTime(); t <= today.getTime(); t += DAY) {
    const agg = dailyAggregate(scope, new Date(t), seed)
    peak = Math.max(peak, agg.peak)
    daily.push({ date: new Date(t).toISOString(), energy_kwh: round(agg.energy, 2) })
  }
  let prev = 0
  for (let t = prevStart.getTime(); t < monthStart.getTime(); t += DAY) {
    prev += dailyAggregate(scope, new Date(t), seed).energy
  }
  const mtd = daily.reduce((s, d) => s + d.energy_kwh, 0)
  return {
    meter_id: meter.meter_id,
    region: meter.region,
    tariff: 'Residential · Time-of-use (demo)',
    month_to_date_kwh: round(mtd, 1),
    previous_month_kwh: round(prev, 1),
    avg_daily_kwh: round(mtd / daily.length, 2),
    peak_kw: round(peak, 2),
    daily,
    hourly_profile: hourlyProfileFor(scope, '30d', seed).map((p) => ({
      ...p,
      avg_active_power_kw: round(p.avg_active_power_kw, 2),
      peak_active_power_kw: round(p.peak_active_power_kw, 2),
    })),
  }
}

export function mockReports(): ReportDefinition[] {
  return [
    {
      report_id: 'rpt-consumption-overview',
      title: 'Consumption Overview',
      description: 'Fleet-wide energy consumption by region, meter type, and time of use.',
      category: 'consumption',
      audience: ['analyst', 'admin'],
      refresh_cadence: 'Daily · 02:00 UTC',
      powerbi_report_id: null,
      highlight: { label: 'Coverage', value: '103k meters' },
    },
    {
      report_id: 'rpt-grid-reliability',
      title: 'Grid & Transformer Reliability',
      description: 'Transformer loading trends, voltage compliance, and overload incidents.',
      category: 'grid',
      audience: ['analyst', 'admin'],
      refresh_cadence: 'Hourly',
      powerbi_report_id: null,
      highlight: { label: 'Assets', value: '45 transformers' },
    },
    {
      report_id: 'rpt-anomaly-review',
      title: 'Anomaly Review',
      description: 'Detected anomalies by type, severity, and resolution time for operations review.',
      category: 'anomaly',
      audience: ['analyst', 'admin'],
      refresh_cadence: 'Every 15 minutes',
      powerbi_report_id: null,
      highlight: { label: 'Categories', value: '3 types' },
    },
    {
      report_id: 'rpt-peak-demand',
      title: 'Peak Demand Forecast',
      description: 'Historical peaks versus forecast demand to support capacity planning.',
      category: 'grid',
      audience: ['analyst', 'admin'],
      refresh_cadence: 'Weekly · Monday',
      powerbi_report_id: null,
      highlight: { label: 'Horizon', value: '12 weeks' },
    },
    {
      report_id: 'rpt-customer-monthly',
      title: 'My Monthly Usage Statement',
      description: 'Monthly consumption summary, time-of-use split, and comparison with last month.',
      category: 'customer',
      audience: ['customer', 'analyst', 'admin'],
      refresh_cadence: 'Monthly',
      powerbi_report_id: null,
      highlight: { label: 'Scope', value: 'Single meter' },
    },
    {
      report_id: 'rpt-customer-efficiency',
      title: 'Energy Efficiency Insights',
      description: 'Usage patterns compared with similar households and suggested savings.',
      category: 'customer',
      audience: ['customer', 'analyst', 'admin'],
      refresh_cadence: 'Monthly',
      powerbi_report_id: null,
      highlight: { label: 'Benchmark', value: 'Peer group' },
    },
  ]
}

export function mockUsers(): PlatformUser[] {
  const rows: [string, string, PlatformUser['role'], PlatformUser['region'], PlatformUser['status'], number][] = [
    ['Layla Hassan', 'layla.hassan', 'admin', 'all', 'active', 0.2],
    ['Omar Farouk', 'omar.farouk', 'analyst', 'all', 'active', 1.5],
    ['Sara Mostafa', 'sara.mostafa', 'analyst', 'East', 'active', 3],
    ['Daniel Ortiz', 'daniel.ortiz', 'analyst', 'Central', 'active', 26],
    ['Mina Adel', 'mina.adel', 'analyst', 'North', 'invited', 0],
    ['Grace Kim', 'grace.kim', 'customer', 'North', 'active', 5],
    ['Youssef Nabil', 'youssef.nabil', 'customer', 'South', 'active', 48],
    ['Priya Raman', 'priya.raman', 'customer', 'West', 'suspended', 340],
    ['Ahmed Samir', 'ahmed.samir', 'admin', 'all', 'active', 12],
    ['Nour Khaled', 'nour.khaled', 'customer', 'Central', 'active', 70],
  ]
  return rows.map(([name, handle, role, region, status, hoursAgo], i) => ({
    user_id: `usr-${String(1001 + i)}`,
    name,
    email: `${handle}@example.org`,
    role,
    region,
    status,
    last_active:
      status === 'invited' ? '' : new Date(SIMULATION_ANCHOR.getTime() - hoursAgo * HOUR).toISOString(),
  }))
}

/** Sample of raw 15-minute readings, used to illustrate the canonical record schema. */
export function mockSampleReadings(count = 6): MeterReading[] {
  return SAMPLE_METERS.slice(0, count).map((m, i) => {
    const ts = new Date(SIMULATION_ANCHOR.getTime() - i * 15 * 60_000)
    const kw = activePowerKw({ regions: [m.region], types: [m.meter_type], meterCount: 1 }, ts, m.meter_id)
    const site = SITES.find((s) => s.name === m.site)!
    return {
      meter_id: m.meter_id,
      timestamp: ts.toISOString(),
      region: m.region,
      meter_type: m.meter_type,
      transformer_id: transformerIdFor(site, i % TRANSFORMERS_PER_SITE),
      active_power_kw: round(kw, 3),
      reactive_power_kvar: round(kw * 0.24, 3),
      voltage_v: round(229 + noise(`rv|${m.meter_id}`) * 4, 1),
      energy_kwh: round(kw * 0.25, 3),
    }
  })
}
