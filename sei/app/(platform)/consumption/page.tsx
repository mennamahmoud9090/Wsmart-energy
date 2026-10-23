import type { Metadata } from 'next'
import { ConsumptionView } from '@/components/consumption/consumption-view'

export const metadata: Metadata = { title: 'Energy Consumption' }

export default function Page() {
  return <ConsumptionView />
}
