import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { logout as logoutRequest } from '@/api/auth'
import type { User } from '@/api/types'
import { clearSession, readToken, readUser, writeSession } from '@/lib/session'

type AuthContextValue = {
  token: string | null
  user: User | null
  setSession: (token: string, user: User, refresh?: string | null) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readToken())
  const [user, setUser] = useState<User | null>(() => readUser())

  const setSession = useCallback(
    (nextToken: string, nextUser: User, refresh?: string | null) => {
      writeSession(nextToken, nextUser, refresh)
      setToken(nextToken)
      setUser(nextUser)
    },
    [],
  )

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      // The local session still has to end.
    }
    clearSession()
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ token, user, setSession, logout }),
    [token, user, setSession, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
