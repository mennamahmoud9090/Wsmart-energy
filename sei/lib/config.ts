/**
 * Public runtime configuration. Only non-secret values belong here: anything
 * prefixed NEXT_PUBLIC_ is bundled into the browser. Warehouse credentials,
 * Power BI service principals, and signing keys must live in the backend API.
 */

export type DataSourceMode = 'mock' | 'api'

function readNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && value !== undefined && value !== '' ? parsed : fallback
}

const rawMode = process.env.NEXT_PUBLIC_DATA_SOURCE

export const appConfig = {
  /** Base URL of the platform's backend API (gateway in front of Snowflake / services). */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
  /** "mock" serves synthetic data from lib/mock-data; "api" calls apiBaseUrl. */
  dataSource: (rawMode === 'api' ? 'api' : 'mock') as DataSourceMode,
  /** Optional link to a published Power BI workspace (a plain URL, not an embed token). */
  powerBiWorkspaceUrl: process.env.NEXT_PUBLIC_POWERBI_WORKSPACE_URL ?? '',
} as const

/**
 * Demo thresholds used to classify simulated readings. They are configurable
 * via env vars and should eventually be served by the backend per transformer.
 */
export const gridThresholds = {
  transformerWarningPct: readNumber(process.env.NEXT_PUBLIC_THRESHOLD_TRANSFORMER_WARNING_PCT, 80),
  transformerOverloadPct: readNumber(process.env.NEXT_PUBLIC_THRESHOLD_TRANSFORMER_OVERLOAD_PCT, 95),
  nominalVoltageV: readNumber(process.env.NEXT_PUBLIC_NOMINAL_VOLTAGE_V, 230),
  voltageTolerancePct: readNumber(process.env.NEXT_PUBLIC_VOLTAGE_TOLERANCE_PCT, 10),
} as const

export const voltageBand = {
  min: gridThresholds.nominalVoltageV * (1 - gridThresholds.voltageTolerancePct / 100),
  max: gridThresholds.nominalVoltageV * (1 + gridThresholds.voltageTolerancePct / 100),
}

export const isApiConfigured = appConfig.dataSource === 'api' && appConfig.apiBaseUrl !== ''
