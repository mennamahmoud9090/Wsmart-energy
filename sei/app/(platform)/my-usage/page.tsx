import type { Metadata } from 'next'
import { MyUsageView } from '@/components/usage/my-usage-view'

export const metadata: Metadata = { title: 'My Usage' }

export default function Page() {
  return <MyUsageView />
}
