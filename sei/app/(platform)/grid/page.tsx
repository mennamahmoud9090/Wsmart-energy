import type { Metadata } from 'next'
import { GridView } from '@/components/grid/grid-view'

export const metadata: Metadata = { title: 'Grid & Transformers' }

export default function Page() {
  return <GridView />
}
