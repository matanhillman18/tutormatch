import type { UserRole } from '@/types'

export interface Session {
  id: string
  role: UserRole
  name: string
  email: string
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('tm_session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setSession(session: Session) {
  localStorage.setItem('tm_session', JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem('tm_session')
}
