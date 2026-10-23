/**
 * PROPOSED backend contract. These paths are not implemented anywhere yet —
 * they document what the frontend will call once the backend API (in front
 * of Snowflake and the platform services) exists. See README "Integration".
 */
export const endpoints = {
  session: '/v1/auth/session',
  login: '/v1/auth/login',
  logout: '/v1/auth/logout',
  dashboard: '/v1/dashboard/summary',
  consumption: '/v1/consumption/timeseries',
  meterComparison: '/v1/consumption/meters',
  grid: '/v1/grid/transformers',
  alerts: '/v1/anomalies/alerts',
  alertStatus: (alertId: string) => `/v1/anomalies/alerts/${encodeURIComponent(alertId)}/status`,
  customerUsage: '/v1/customers/me/usage',
  reports: '/v1/reports',
  users: '/v1/admin/users',
} as const
