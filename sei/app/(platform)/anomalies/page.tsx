import type { Metadata } from 'next'
import { AnomaliesView } from '@/components/anomalies/anomalies-view'

export const metadata: Metadata = { title: 'Anomaly Detection' }

export default function Page() {
  return <AnomaliesView />
}
