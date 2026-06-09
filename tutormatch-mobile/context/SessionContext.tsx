import React, { createContext, useContext, useEffect, useState } from 'react'
import { loadSession, saveSession, removeSession } from '@/lib/session'
import type { Session } from '@/lib/session'

interface SessionCtx {
  session: Session | null
  loading: boolean
  setSession: (s: Session) => Promise<void>
  clearSession: () => Promise<void>
}

const Ctx = createContext<SessionCtx>({
  session: null,
  loading: true,
  setSession: async () => {},
  clearSession: async () => {},
})

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSession().then(s => {
      setSessionState(s)
      setLoading(false)
    })
  }, [])

  const setSession = async (s: Session) => {
    await saveSession(s)
    setSessionState(s)
  }

  const clearSession = async () => {
    await removeSession()
    setSessionState(null)
  }

  return (
    <Ctx.Provider value={{ session, loading, setSession, clearSession }}>
      {children}
    </Ctx.Provider>
  )
}

export const useSession = () => useContext(Ctx)
