import { appConfig } from '@/lib/config'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public path: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type QueryValue = string | number | boolean | undefined | null

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  if (!appConfig.apiBaseUrl) {
    throw new ApiError(
      'NEXT_PUBLIC_API_BASE_URL is not set. Configure the backend URL or switch NEXT_PUBLIC_DATA_SOURCE to "mock".',
      0,
      path,
    )
  }
  const url = new URL(path.replace(/^\//, ''), appConfig.apiBaseUrl.replace(/\/?$/, '/'))
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
  return url.toString()
}

/**
 * Thin JSON client for the platform backend. Authentication relies on an
 * HttpOnly session cookie issued by the backend (credentials: 'include'), so
 * no tokens are stored in or attached from browser JavaScript.
 */
export async function apiRequest<T>(
  path: string,
  options: { method?: 'GET' | 'POST' | 'PATCH'; query?: Record<string, QueryValue>; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status, path)
  }
  return (await response.json()) as T
}
