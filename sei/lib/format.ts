import type { AlertStatus, AnomalyType, MeterType, Severity } from '@/lib/types'

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const integer = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

export function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value)
}

export function formatCompact(value: number) {
  return compact.format(value)
}

export function formatInteger(value: number) {
  return integer.format(value)
}

/** Formats energy with an appropriate SI prefix (kWh → MWh → GWh). */
export function formatEnergy(kwh: number, digits = 1) {
  const abs = Math.abs(kwh)
  if (abs >= 1_000_000) return `${formatNumber(kwh / 1_000_000, digits)} GWh`
  if (abs >= 1_000) return `${formatNumber(kwh / 1_000, digits)} MWh`
  return `${formatNumber(kwh, digits)} kWh`
}

/** Formats power with an appropriate SI prefix (kW → MW → GW). */
export function formatPower(kw: number, digits = 1) {
  const abs = Math.abs(kw)
  if (abs >= 1_000_000) return `${formatNumber(kw / 1_000_000, digits)} GW`
  if (abs >= 1_000) return `${formatNumber(kw / 1_000, digits)} MW`
  return `${formatNumber(kw, digits)} kW`
}

export function formatPercent(value: number, digits = 1) {
  return `${value > 0 ? '+' : ''}${formatNumber(value, digits)}%`
}

const dateTime = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
})
const dateOnly = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const monthYear = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
const timeOnly = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })

export function formatDateTime(iso: string) {
  return iso ? `${dateTime.format(new Date(iso))} UTC` : '—'
}
export function formatDate(iso: string) {
  return dateOnly.format(new Date(iso))
}
export function formatMonth(iso: string) {
  return monthYear.format(new Date(iso))
}
export function formatTime(iso: string) {
  return timeOnly.format(new Date(iso))
}
export function formatHour(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`
}

export const ANOMALY_LABELS: Record<AnomalyType, string> = {
  transformer_load_surge: 'Transformer load surge',
  persistent_voltage_drop: 'Persistent voltage drop',
  irregular_consumption_pattern: 'Irregular consumption',
}

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const STATUS_LABELS: Record<AlertStatus, string> = {
  open: 'Open',
  investigating: 'Investigating',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
}

export const METER_TYPE_LABELS: Record<MeterType, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  industrial: 'Industrial',
}
