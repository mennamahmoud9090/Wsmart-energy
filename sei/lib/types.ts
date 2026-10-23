/**
 * Domain types shared by the UI and the data-access layer. Field names mirror
 * the warehouse columns (snake_case) so API responses can be passed through
 * without remapping.
 */

export type Region = 'North' | 'South' | 'East' | 'West' | 'Central'
export type MeterType = 'residential' | 'commercial' | 'industrial'
export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type AnomalyType =
  | 'transformer_load_surge'
  | 'persistent_voltage_drop'
  | 'irregular_consumption_pattern'
export type AlertStatus = 'open' | 'investigating' | 'resolved' | 'dismissed'
/**
 * Where an alert came from. "simulated" = produced by the synthetic generator /
 * demo data; "detected" = produced by the real detection job (Spark) on pipeline data.
 */
export type AlertOrigin = 'simulated' | 'detected'
export type TransformerStatus = 'normal' | 'warning' | 'overloaded'

export type DateRange = '24h' | '7d' | '30d' | '90d'
export type Granularity = 'daily' | 'weekly' | 'monthly'

export interface MeterReading {
  meter_id: string
  timestamp: string
  region: Region
  meter_type: MeterType
  transformer_id: string
  active_power_kw: number
  reactive_power_kvar: number
  voltage_v: number
  energy_kwh: number
}

export interface DashboardFilters {
  range: DateRange
  region: Region | 'all'
  meterType: MeterType | 'all'
}

export interface KpiValue {
  value: number
  /** Percentage change vs. the previous equivalent period. */
  change_pct: number
}

export interface KpiSummary {
  total_energy_kwh: KpiValue
  avg_active_power_kw: KpiValue
  peak_demand_kw: KpiValue & { peak_timestamp: string }
  active_meters: KpiValue & { total_meters: number }
  /** value = active (open or investigating) anomalies; total = all anomalies in the period. */
  anomalies_detected: KpiValue & { critical: number; total: number }
}

export interface ConsumptionPoint {
  timestamp: string
  energy_kwh: number
  active_power_kw: number
  reactive_power_kvar: number
}

export interface HourlyProfilePoint {
  hour: number
  avg_active_power_kw: number
  peak_active_power_kw: number
}

export interface LocationConsumption {
  location: string
  region: Region
  energy_kwh: number
  meters: number
  avg_active_power_kw: number
}

export interface AnomalyDistributionPoint {
  anomaly_type: AnomalyType
  count: number
}

export interface Alert {
  alert_id: string
  meter_id: string
  transformer_id: string
  region: Region
  meter_type: MeterType
  location: string
  timestamp: string
  anomaly_type: AnomalyType
  severity: Severity
  observed_value: number
  expected_value: number
  unit: string
  status: AlertStatus
  origin: AlertOrigin
  description: string
}

export interface DashboardData {
  kpis: KpiSummary
  trend: ConsumptionPoint[]
  hourly_profile: HourlyProfilePoint[]
  by_location: LocationConsumption[]
  anomaly_distribution: AnomalyDistributionPoint[]
  recent_alerts: Alert[]
}

export interface ConsumptionQuery {
  granularity: Granularity
  periods: number
  region: Region | 'all'
  meterId: string | 'all'
}

export interface ConsumptionData {
  series: ConsumptionPoint[]
  by_location: LocationConsumption[]
  totals: { energy_kwh: number; avg_active_power_kw: number; peak_active_power_kw: number }
}

export interface MeterComparisonRow {
  meter_id: string
  site: string
  region: Region
  meter_type: MeterType
  energy_kwh: number
  avg_active_power_kw: number
  peak_active_power_kw: number
}

export interface MeterComparisonQuery {
  granularity: Granularity
  periods: number
}

export interface Transformer {
  transformer_id: string
  site: string
  region: Region
  rated_capacity_kva: number
  current_load_kva: number
  loading_pct: number
  peak_demand_kw: number
  avg_voltage_v: number
  connected_meters: number
  status: TransformerStatus
}

export interface VoltagePoint {
  timestamp: string
  North: number
  South: number
  East: number
  West: number
  Central: number
}

export interface RegionGridSummary {
  region: Region
  avg_loading_pct: number
  peak_demand_kw: number
  transformers: number
  overloaded: number
  min_voltage_v: number
}

export interface GridQuery {
  region: Region | 'all'
  range: DateRange
}

export interface GridData {
  transformers: Transformer[]
  voltage_series: VoltagePoint[]
  regions: RegionGridSummary[]
}

export interface AlertQuery {
  region: Region | 'all'
  range: DateRange
}

export interface CustomerUsage {
  meter_id: string
  region: Region
  tariff: string
  month_to_date_kwh: number
  previous_month_kwh: number
  avg_daily_kwh: number
  peak_kw: number
  daily: { date: string; energy_kwh: number }[]
  hourly_profile: HourlyProfilePoint[]
}

export type ReportCategory = 'consumption' | 'grid' | 'anomaly' | 'customer'

export interface ReportDefinition {
  report_id: string
  title: string
  description: string
  category: ReportCategory
  audience: Role[]
  refresh_cadence: string
  /** Power BI report id; null until the report is published and wired to the backend. */
  powerbi_report_id: string | null
  highlight: { label: string; value: string }
}

export type Role = 'customer' | 'analyst' | 'admin'

export interface PlatformUser {
  user_id: string
  name: string
  email: string
  role: Role
  region: Region | 'all'
  status: 'active' | 'invited' | 'suspended'
  last_active: string
}
