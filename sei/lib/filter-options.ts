import type { FilterOption } from '@/components/shared/filter-select'
import { referenceData } from '@/lib/api/energy-service'
import { METER_TYPE_LABELS } from '@/lib/format'
import type { DateRange, MeterType, Region } from '@/lib/types'

export const RANGE_OPTIONS: FilterOption<DateRange>[] = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

export const REGION_OPTIONS: FilterOption<Region | 'all'>[] = [
  { value: 'all', label: 'All regions' },
  ...referenceData.regions.map((r) => ({ value: r, label: `${r} region` })),
]

export const METER_TYPE_OPTIONS: FilterOption<MeterType | 'all'>[] = [
  { value: 'all', label: 'All meter types' },
  ...referenceData.meterTypes.map((t) => ({ value: t, label: METER_TYPE_LABELS[t] })),
]
