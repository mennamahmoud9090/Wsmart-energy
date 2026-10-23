'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import type { DemoDataState } from '@/lib/api/energy-service'

interface DemoStateContextValue {
  dataState: DemoDataState
  setDataState: (state: DemoDataState) => void
}

const DemoStateContext = createContext<DemoStateContextValue | null>(null)

export function DemoStateProvider({ children }: { children: React.ReactNode }) {
  const [dataState, setDataState] = useState<DemoDataState>('normal')
  const value = useMemo(() => ({ dataState, setDataState }), [dataState])
  return <DemoStateContext.Provider value={value}>{children}</DemoStateContext.Provider>
}

export function useDemoState() {
  const ctx = useContext(DemoStateContext)
  if (!ctx) throw new Error('useDemoState must be used within DemoStateProvider')
  return ctx
}
