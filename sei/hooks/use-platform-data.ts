'use client'

import useSWR from 'swr'
import { energyService } from '@/lib/api/energy-service'
import { useDemoState } from '@/components/providers/demo-state-provider'
import type { AlertQuery, ConsumptionQuery, DashboardFilters, GridQuery, MeterComparisonQuery } from '@/lib/types'

const swrOptions = { revalidateOnFocus: false, keepPreviousData: true } as const

/** Pass enabled=false to skip the request entirely (e.g. when the current role may not see fleet data). */
export function useDashboard(filters: DashboardFilters, enabled = true) {
  const { dataState } = useDemoState()
  return useSWR(enabled ? ['dashboard', filters, dataState] : null, () => energyService.getDashboard(filters, dataState), swrOptions)
}

export function useConsumption(query: ConsumptionQuery) {
  const { dataState } = useDemoState()
  return useSWR(['consumption', query, dataState], () => energyService.getConsumption(query, dataState), swrOptions)
}

export function useMeterComparison(query: MeterComparisonQuery) {
  const { dataState } = useDemoState()
  return useSWR(['meter-comparison', query, dataState], () => energyService.getMeterComparison(query, dataState), swrOptions)
}

export function useGrid(query: GridQuery) {
  const { dataState } = useDemoState()
  return useSWR(['grid', query, dataState], () => energyService.getGrid(query, dataState), swrOptions)
}

export function useAlerts(query: AlertQuery) {
  const { dataState } = useDemoState()
  return useSWR(['alerts', query, dataState], () => energyService.getAlerts(query, dataState), swrOptions)
}

export function useCustomerUsage() {
  const { dataState } = useDemoState()
  return useSWR(['customer-usage', dataState], () => energyService.getCustomerUsage(dataState), swrOptions)
}

export function useReports() {
  const { dataState } = useDemoState()
  return useSWR(['reports', dataState], () => energyService.getReports(dataState), swrOptions)
}

export function useUsers() {
  const { dataState } = useDemoState()
  return useSWR(['users', dataState], () => energyService.getUsers(dataState), swrOptions)
}
