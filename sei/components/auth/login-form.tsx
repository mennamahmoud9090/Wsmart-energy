'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useId, useState } from 'react'
import { AlertCircle, BarChart3, Eye, EyeOff, Loader2, ShieldCheck, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EMAIL_PATTERN, MIN_PASSWORD_LENGTH } from '@/lib/auth/demo-auth'
import { canAccessPath, homeForRole, ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/lib/auth/roles'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAuth } from './auth-provider'

const ROLE_OPTIONS: { role: Role; icon: typeof User; email: string }[] = [
  { role: 'customer', icon: User, email: 'customer@demo.energy' },
  { role: 'analyst', icon: BarChart3, email: 'analyst@demo.energy' },
  { role: 'admin', icon: ShieldCheck, email: 'admin@demo.energy' },
]

interface FieldErrors {
  email?: string
  password?: string
}

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {}
  if (!email.trim()) errors.email = 'Email is required.'
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address, e.g. name@company.com.'
  if (!password) errors.password = 'Password is required.'
  else if (password.length < MIN_PASSWORD_LENGTH) errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
  return errors
}

export function LoginForm() {
  const { signIn, status, session } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const ids = { email: useId(), password: useId(), emailErr: useId(), passwordErr: useId() }

  const [role, setRole] = useState<Role>('analyst')
  const [email, setEmail] = useState('analyst@demo.energy')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && session) router.replace(homeForRole(session.role))
  }, [status, session, router])

  function selectRole(next: Role) {
    setRole(next)
    const preset = ROLE_OPTIONS.find((o) => o.role === next)
    if (preset && ROLE_OPTIONS.some((o) => o.email === email)) setEmail(preset.email)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const nextErrors = validate(email, password)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    const result = await signIn({ email, password, role })
    setSubmitting(false)
    if (!result.ok) {
      setFormError(result.error)
      return
    }
    const next = params.get('next')
    const target = next && next.startsWith('/') && canAccessPath(role, next) ? next : homeForRole(role)
    router.replace(target)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {formError}
        </div>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-foreground">Sign in as (demo role)</legend>
        <div className="grid grid-cols-3 gap-2">
          {ROLE_OPTIONS.map(({ role: optionRole, icon: Icon }) => {
            const selected = role === optionRole
            return (
              <label
                key={optionRole}
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors',
                  'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                  selected ? 'border-teal bg-teal/5 text-foreground' : 'border-border bg-card text-muted-foreground hover:border-teal/50',
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={optionRole}
                  checked={selected}
                  onChange={() => selectRole(optionRole)}
                  className="sr-only"
                />
                <Icon className={cn('size-4', selected ? 'text-teal' : '')} aria-hidden="true" />
                <span className="text-xs font-medium leading-tight">{ROLE_LABELS[optionRole]}</span>
              </label>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor={ids.email}>Work email</Label>
        <Input
          id={ids.email}
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
          }}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? ids.emailErr : undefined}
          placeholder="name@company.com"
          className="h-10"
        />
        {errors.email && (
          <p id={ids.emailErr} className="text-xs text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={ids.password}>Password</Label>
        <div className="relative">
          <Input
            id={ids.password}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
            }}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? ids.passwordErr : undefined}
            placeholder="At least 8 characters"
            className="h-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        </div>
        {errors.password && (
          <p id={ids.passwordErr} className="text-xs text-destructive">
            {errors.password}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="h-10 w-full" disabled={submitting}>
        {submitting && <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden="true" />}
        {submitting ? 'Signing in…' : 'Sign in'}
      </Button>

      <p className="rounded-lg bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Demo authentication.</span> No identity provider is configured yet.
        Any valid email and a password of 8+ characters will sign you in; nothing is sent to a server.
      </p>
    </form>
  )
}
