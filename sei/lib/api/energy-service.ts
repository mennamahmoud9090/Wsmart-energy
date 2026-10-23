/**
 * Centralized data-access layer. UI code calls these functions (via hooks)
 * and never knows whether data comes from the synthetic generator or the
 * backend API. Switch with NEXT_PUBLIC_DATA_SOURCE=mock|api.
 */
import { appConfig } from '@/lib/config'
import * as mock from '@/lib/mock-data'
import type {
  Alert,
  AlertQuery,
  AlertStatus,
  ConsumptionData,
  ConsumptionQuery,
  CustomerUsage,
  DashboardData,
  DashboardFilters,
  GridData,
  GridQuery,
  MeterComparisonQuery,
  MeterComparisonRow,
  PlatformUser,
  ReportDefinition,
} from '@/lib/types'
import { apiRequest } from './http-client'
import { endpoints } from './endpoints'

/** Demo-only switch that lets presenters show loading, empty and error states. */
export type DemoDataState = 'normal' | 'slow' | 'empty' | 'error'

const useMock = appConfig.dataSource === 'mock'

async function simulate<T>(state: DemoDataState, produce: () => T, empty: () => T): Promise<T> {
  const delay = state === 'slow' ? 2200 : 280 + Math.random() * 320
  await new Promise((resolve) => setTimeout(resolve, delay))
  if (state === 'error') {
    throw new Error('Simulated upstream failure (demo data state set to "error").')
  }
  return state === 'empty' ? empty() : produce()
}

const emptyKpi = { value: 0, change_pct: 0 }

export const energyService = {
  getDashboard(filters: DashboardFilters, state: DemoDataState = 'normal'): Promise<DashboardData> {
    if (!useMock) return apiRequest(endpoints.dashboard, { query: { ...filters } })
    return simulate(
      state,
      () => mock.mockDashboard(filters),
      () => ({
        kpis: {
          total_energy_kwh: emptyKpi,
          avg_active_power_kw: emptyKpi,
          peak_demand_kw: { ...emptyKpi, peak_timestamp: '' },
          active_meters: { ...emptyKpi, total_meters: 0 },
          anomalies_detected: { ...emptyKpi, critical: 0, total: 0 },
        },
        trend: [],
        hourly_profile: [],
        by_location: [],
        anomaly_distribution: [],
        recent_alerts: [],
      }),
    )
  },

  getConsumption(query: ConsumptionQuery, state: DemoDataState = 'normal'): Promise<ConsumptionData> {
    if (!useMock) return apiRequest(endpoints.consumption, { query: { ...query } })
    return simulate(
      state,
      () => mock.mockConsumption(query),
      () => ({ series: [], by_location: [], totals: { energy_kwh: 0, avg_active_power_kw: 0, peak_active_power_kw: 0 } }),
    )
  },

  getMeterComparison(query: MeterComparisonQuery, state: DemoDataState = 'normal'): Promise<MeterComparisonRow[]> {
    if (!useMock) return apiRequest(endpoints.meterComparison, { query: { ...query } })
    return simulate(state, () => mock.mockMeterComparison(query), () => [])
  },

  getGrid(query: GridQuery, state: DemoDataState = 'normal'): Promise<GridData> {
    if (!useMock) return apiRequest(endpoints.grid, { query: { ...query } })
    return simulate(state, () => mock.mockGrid(query), () => ({ transformers: [], voltage_series: [], regions: [] }))
  },

  getAlerts(query: AlertQuery, state: DemoDataState = 'normal'): Promise<Alert[]> {
    if (!useMock) return apiRequest(endpoints.alerts, { query: { ...query } })
    return simulate(state, () => mock.mockAlerts(query), () => [])
  },

  async updateAlertStatus(alertId: string, status: AlertStatus): Promise<Alert> {
    if (!useMock) return apiRequest(endpoints.alertStatus(alertId), { method: 'PATCH', body: { status } })
    await new Promise((resolve) => setTimeout(resolve, 350))
    return mock.mockUpdateAlertStatus(alertId, status)
  },

  getCustomerUsage(state: DemoDataState = 'normal'): Promise<CustomerUsage | null> {
    if (!useMock) return apiRequest(endpoints.customerUsage)
    return simulate<CustomerUsage | null>(state, () => mock.mockCustomerUsage(), () => null)
  },

  getReports(state: DemoDataState = 'normal'): Promise<ReportDefinition[]> {
    if (!useMock) return apiRequest(endpoints.reports)
    return simulate(state, () => mock.mockReports(), () => [])
  },

  getUsers(state: DemoDataState = 'normal'): Promise<PlatformUser[]> {
    if (!useMock) return apiRequest(endpoints.users)
    return simulate(state, () => mock.mockUsers(), () => [])
  },
}

/** Static reference data for filters. In API mode this would come from /v1/meta. */
export const referenceData = {
  regions: mock.REGIONS,
  meterTypes: mock.METER_TYPES,
  sampleMeters: mock.SAMPLE_METERS,
  sites: mock.SITES,
  simulationAnchor: mock.SIMULATION_ANCHOR,
  sampleReadings: () => mock.mockSampleReadings(),
}
