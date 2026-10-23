/**
 * SIMULATED DATA — static catalog describing the synthetic grid: regions,
 * sites, transformers, and the meter fleet. None of these entities are real.
 */
import type { MeterType, Region } from '@/lib/types'

export const SIMULATION_ANCHOR = new Date('2026-10-23T14:00:00.000Z')

export const REGIONS: Region[] = ['North', 'South', 'East', 'West', 'Central']

export const REGION_CODES: Record<Region, string> = {
  North: 'NO',
  South: 'SO',
  East: 'EA',
  West: 'WE',
  Central: 'CE',
}

export const METER_TYPES: MeterType[] = ['residential', 'commercial', 'industrial']

/** Meter counts per region and type. Total ≈ 103,000 simulated meters. */
export const FLEET: Record<Region, Record<MeterType, number>> = {
  North: { residential: 20_120, commercial: 3_240, industrial: 820 },
  South: { residential: 17_610, commercial: 2_760, industrial: 670 },
  East: { residential: 14_880, commercial: 3_010, industrial: 1_430 },
  West: { residential: 15_270, commercial: 2_190, industrial: 500 },
  Central: { residential: 15_420, commercial: 4_520, industrial: 560 },
}

/** Average active power per meter (kW) by meter type, before load-shape scaling. */
export const AVG_KW_PER_METER: Record<MeterType, number> = {
  residential: 1.05,
  commercial: 6.2,
  industrial: 36,
}

export interface SiteDefinition {
  name: string
  region: Region
  /** Share of the region's meters served by this site. */
  share: number
}

export const SITES: SiteDefinition[] = [
  { name: 'Northgate', region: 'North', share: 0.42 },
  { name: 'Riverside Heights', region: 'North', share: 0.33 },
  { name: 'Highland Park', region: 'North', share: 0.25 },
  { name: 'Harbor District', region: 'South', share: 0.38 },
  { name: 'Southfield', region: 'South', share: 0.36 },
  { name: 'Bayview', region: 'South', share: 0.26 },
  { name: 'Eastport Industrial', region: 'East', share: 0.46 },
  { name: 'Sunrise Estates', region: 'East', share: 0.31 },
  { name: 'Lakeside', region: 'East', share: 0.23 },
  { name: 'Westbrook', region: 'West', share: 0.4 },
  { name: 'Canyon Ridge', region: 'West', share: 0.34 },
  { name: 'Meadowvale', region: 'West', share: 0.26 },
  { name: 'Downtown Core', region: 'Central', share: 0.44 },
  { name: 'Civic Center', region: 'Central', share: 0.3 },
  { name: 'Midtown', region: 'Central', share: 0.26 },
]

export const TRANSFORMERS_PER_SITE = 3

export function getTotalMeters(region: Region | 'all', meterType: MeterType | 'all') {
  const regions = region === 'all' ? REGIONS : [region]
  const types = meterType === 'all' ? METER_TYPES : [meterType]
  return regions.reduce(
    (sum, r) => sum + types.reduce((inner, t) => inner + FLEET[r][t], 0),
    0,
  )
}

export function siteCode(site: SiteDefinition) {
  const index = SITES.filter((s) => s.region === site.region).indexOf(site) + 1
  return `${REGION_CODES[site.region]}${index}`
}

export function transformerIdFor(site: SiteDefinition, index: number) {
  return `TX-${siteCode(site)}-${String.fromCharCode(65 + index)}`
}

/** A handful of sample meters exposed in meter-level filters. */
export const SAMPLE_METERS: { meter_id: string; region: Region; meter_type: MeterType; site: string }[] = [
  { meter_id: 'MTR-NO-004821', region: 'North', meter_type: 'residential', site: 'Northgate' },
  { meter_id: 'MTR-NO-019334', region: 'North', meter_type: 'commercial', site: 'Riverside Heights' },
  { meter_id: 'MTR-SO-007712', region: 'South', meter_type: 'residential', site: 'Harbor District' },
  { meter_id: 'MTR-SO-015090', region: 'South', meter_type: 'industrial', site: 'Southfield' },
  { meter_id: 'MTR-EA-002267', region: 'East', meter_type: 'industrial', site: 'Eastport Industrial' },
  { meter_id: 'MTR-EA-011843', region: 'East', meter_type: 'residential', site: 'Sunrise Estates' },
  { meter_id: 'MTR-WE-008456', region: 'West', meter_type: 'commercial', site: 'Westbrook' },
  { meter_id: 'MTR-CE-013579', region: 'Central', meter_type: 'commercial', site: 'Downtown Core' },
]

export const CUSTOMER_METER_ID = 'MTR-NO-004821'
