import type { AuthSuccess, User } from '@/api/types'

export const TOKEN_KEY = 'auth_token'
export const REFRESH_KEY = 'auth_refresh'
export const USER_KEY = 'auth_user'

export function readToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function readRefresh(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function readUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function accessFromAuth(data: AuthSuccess): string {
  return data.access || data.token
}

export function writeSession(
  token: string,
  user: User,
  refresh?: string | null,
): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  if (refresh) {
    localStorage.setItem(REFRESH_KEY, refresh)
  }
}

export function writeAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
}

export function safeNext(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/dashboard'
  }
  return value
}
