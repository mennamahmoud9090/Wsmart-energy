/**
 * DEMO AUTHENTICATION — placeholder until a real identity provider is
 * configured (e.g. Microsoft Entra ID / Keycloak via the backend).
 *
 * - No credentials are stored or verified; any well-formed email and a
 *   password of 8+ characters are accepted for the selected demo role.
 * - The session lives in sessionStorage and is cleared when the tab closes.
 * - Nothing here is a security boundary. Replace signIn/signOut/readSession
 *   with calls to the backend's /v1/auth/* endpoints (HttpOnly cookies).
 */
import type { Role } from '@/lib/types'

export interface DemoSession {
  name: string
  email: string
  role: Role
  issued_at: string
  demo: true
}

const STORAGE_KEY = 'sei.demo-session'

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const MIN_PASSWORD_LENGTH = 8

export interface SignInInput {
  email: string
  password: string
  role: Role
}

export type SignInResult = { ok: true; session: DemoSession } | { ok: false; error: string }

function nameFromEmail(email: string) {
  const local = email.split('@')[0] ?? 'User'
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(' ')
}

export async function demoSignIn({ email, password, role }: SignInInput): Promise<SignInResult> {
  await new Promise((resolve) => setTimeout(resolve, 650))
  if (!EMAIL_PATTERN.test(email.trim())) return { ok: false, error: 'Enter a valid email address.' }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` }
  }
  const session: DemoSession = {
    name: nameFromEmail(email.trim()),
    email: email.trim().toLowerCase(),
    role,
    issued_at: new Date().toISOString(),
    demo: true,
  }
  writeSession(session)
  return { ok: true, session }
}

export function readSession(): DemoSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as DemoSession) : null
  } catch {
    return null
  }
}

export function writeSession(session: DemoSession) {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession() {
  window.sessionStorage.removeItem(STORAGE_KEY)
}
