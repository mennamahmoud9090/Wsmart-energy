'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LogoMark } from '@/components/brand/logo'
import { homeForRole } from '@/lib/auth/roles'
import { useAuth } from './auth-provider'

export function RootRedirect() {
  const { status, session } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated' && session) router.replace(homeForRole(session.role))
    if (status === 'unauthenticated') router.replace('/login')
  }, [status, session, router])

  return (
    <div className="flex min-h-svh items-center justify-center bg-background" role="status">
      <LogoMark className="animate-pulse" />
      <span className="sr-only">Loading Smart Energy Intelligence Platform</span>
    </div>
  )
}
