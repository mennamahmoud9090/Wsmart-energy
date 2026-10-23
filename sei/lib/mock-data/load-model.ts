/**
 * SIMULATED DATA — deterministic load model. Produces plausible fleet-level
 * active power from daily/weekly/seasonal shapes plus seeded noise so the same
 * filters always return the same numbers (stable across renders and reloads).
 */
import type { MeterType, Region } from '@/lib/types'
import { AVG_KW_PER_METER, FLEET, METER_TYPES, REGIONS } from './catalog'

export function hashString(input: string) {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Mulberry32 PRNG seeded from a string. */
export function createRng(seed: string) {
  let a = hashString(seed)
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Stable noise in [-1, 1] for a given key. */
export function noise(key: string) {
  return (hashString(key) / 4294967295) * 2 - 1
}

const HOURLY_SHAPE: Record<MeterType, number[]> = {
  residential: [
    0.52, 0.46, 0.43, 0.42, 0.44, 0.55, 0.78, 0.96, 0.88, 0.74, 0.68, 0.66, 0.7, 0.68, 0.66, 0.72,
    0.88, 1.12, 1.42, 1.55, 1.48, 1.28, 0.98, 0.72,
  ],
  commercial: [
    0.34, 0.32, 0.31, 0.31, 0.33, 0.4, 0.62, 0.98, 1.3, 1.42, 1.46, 1.48, 1.44, 1.47, 1.45, 1.4,
    1.3, 1.1, 0.82, 0.6, 0.5, 0.44, 0.4, 0.36,
  ],
  industrial: [
    0.86, 0.84, 0.83, 0.83, 0.85, 0.92, 1.04, 1.12, 1.16, 1.18, 1.18, 1.16, 1.12, 1.16, 1.17, 1.15,
    1.1, 1.02, 0.96, 0.92, 0.9, 0.89, 0.88, 0.87,
  ],
}

const WEEKEND_FACTOR: Record<MeterType, number> = {
  residential: 1.08,
  commercial: 0.58,
  industrial: 0.78,
}

/** Seasonal multiplier by month (0 = Jan). Winter heating and summer cooling peaks. */
const SEASONAL = [1.2, 1.16, 1.04, 0.95, 0.92, 1.02, 1.12, 1.14, 1.0, 0.96, 1.04, 1.16]

const REGION_BIAS: Record<Region, number> = {
  North: 1.04,
  South: 0.98,
  East: 1.02,
  West: 0.95,
  Central: 1.01,
}

export function loadShape(meterType: MeterType, date: Date) {
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60
  const h0 = Math.floor(hour) % 24
  const h1 = (h0 + 1) % 24
  const t = hour - Math.floor(hour)
  const shape = HOURLY_SHAPE[meterType]
  const hourly = shape[h0] * (1 - t) + shape[h1] * t
  const day = date.getUTCDay()
  const weekend = day === 0 || day === 6 ? WEEKEND_FACTOR[meterType] : 1
  return hourly * weekend * SEASONAL[date.getUTCMonth()]
}

export interface Scope {
  regions: Region[]
  types: MeterType[]
  /** When set, the scope is a single meter rather than the fleet. */
  meterCount?: number
}

export function scopeFrom(region: Region | 'all', meterType: MeterType | 'all'): Scope {
  return {
    regions: region === 'all' ? REGIONS : [region],
    types: meterType === 'all' ? METER_TYPES : [meterType],
  }
}

/** Active power (kW) for the scope at a point in time. */
export function activePowerKw(scope: Scope, date: Date, seed = '') {
  let total = 0
  for (const region of scope.regions) {
    for (const type of scope.types) {
      const meters = scope.meterCount ?? FLEET[region][type]
      const n = noise(`${seed}|${region}|${type}|${date.toISOString()}`) * 0.045
      total += meters * AVG_KW_PER_METER[type] * loadShape(type, date) * REGION_BIAS[region] * (1 + n)
    }
  }
  return total
}

/** Reactive power estimated from a scope-weighted power factor (~0.92–0.96). */
export function reactivePowerKvar(activeKw: number, scope: Scope) {
  const industrialShare = scope.types.includes('industrial') ? 0.32 : 0.22
  return activeKw * industrialShare
}

const dailyCache = new Map<string, { energy: number; peak: number; avg: number }>()

/** Aggregates 24 hourly samples into daily energy (kWh), average and peak power (kW). */
export function dailyAggregate(scope: Scope, dayStart: Date, seed = '') {
  const key = `${scope.regions.join(',')}|${scope.types.join(',')}|${scope.meterCount ?? ''}|${seed}|${dayStart.toISOString()}`
  const cached = dailyCache.get(key)
  if (cached) return cached
  let energy = 0
  let peak = 0
  for (let h = 0; h < 24; h++) {
    const kw = activePowerKw(scope, new Date(dayStart.getTime() + h * 3_600_000), seed)
    energy += kw
    if (kw > peak) peak = kw
  }
  const result = { energy, peak, avg: energy / 24 }
  dailyCache.set(key, result)
  return result
}

export function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

export function round(value: number, digits = 1) {
  const f = 10 ** digits
  return Math.round(value * f) / f
}
