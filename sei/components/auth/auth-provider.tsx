'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  clearSession,
  demoSignIn,
  readSession,
  writeSession,
  type DemoSession,
  type SignInInput,
  type SignInResult,
} from '@/lib/auth/demo-auth'
import type { Role } from '@/lib/types'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  status: AuthStatus
  session: DemoSession | null
  signIn: (input: SignInInput) => Promise<SignInResult>
  signOut: () => void
  switchRole: (role: Role) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<DemoSession | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    const existing = readSession()
    setSession(existing)
    setStatus(existing ? 'authenticated' : 'unauthenticated')
  }, [])

  const signIn = useCallback(async (input: SignInInput) => {
    const result = await demoSignIn(input)
    if (result.ok) {
      setSession(result.session)
      setStatus('authenticated')
    }
    return result
  }, [])

  const signOut = useCallback(() => {
    clearSession()
    setSession(null)
    setStatus('unauthenticated')
  }, [])

  const switchRole = useCallback((role: Role) => {
    setSession((current) => {
      if (!current) return current
      const next = { ...current, role }
      writeSession(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ status, session, signIn, signOut, switchRole }),
    [status, session, signIn, signOut, switchRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
