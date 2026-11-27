import {
  clearSession,
  readRefresh,
  readToken,
  writeAccessToken,
} from '@/lib/session'
import { setApiWaking } from '@/lib/apiWake'

const DEFAULT_BASE = 'http://localhost:4781/api'
const SLOW_MS = 4000

export function apiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE
  return raw.replace(/\/$/, '')
}

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type Options = {
  method?: Method
  body?: unknown
  auth?: boolean
  redirectOn401?: boolean
  _retried?: boolean
  _wakeRetried?: boolean
}

function flatten(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    return value.map(flatten).filter(Boolean).join(' ')
  }
  if (value && typeof value === 'object') {
    return Object.values(value).map(flatten).filter(Boolean).join(' ')
  }
  return ''
}

function readData(err: unknown): unknown {
  if (err && typeof err === 'object' && 'data' in err) {
    return (err as { data: unknown }).data
  }
  return undefined
}

export function formatApiError(err: unknown): string {
  const data = readData(err)
  if (typeof data === 'string' && data.trim()) return data.trim()
  if (Array.isArray(data)) {
    const joined = flatten(data)
    if (joined) return joined
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    const parts: string[] = []
    for (const [key, value] of Object.entries(record)) {
      if (key === 'detail') continue
      const text = flatten(value)
      if (text) parts.push(text)
    }
    if (parts.length) return parts.join(' ')
    if ('detail' in record) {
      const detail = flatten(record.detail)
      if (detail) return detail
    }
  }
  if (err instanceof Error && err.message) return err.message
  return 'Something went wrong'
}

function messageFrom(data: unknown, status: number): string {
  const draft = formatApiError({ data })
  if (draft !== 'Something went wrong') return draft
  return `Request failed (${status})`
}

let refreshInFlight: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight
  refreshInFlight = (async () => {
    const refresh = readRefresh()
    if (!refresh) return null
    try {
      const response = await fetch(`${apiBase()}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh }),
      })
      if (!response.ok) return null
      const data = (await response.json()) as { access?: string }
      if (!data.access) return null
      writeAccessToken(data.access)
      return data.access
    } catch {
      return null
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

function redirectToLogin(): void {
  clearSession()
  const pathName = window.location.pathname
  if (!pathName.startsWith('/login')) {
    const next = `${pathName}${window.location.search}`
    window.location.assign(`/login?next=${encodeURIComponent(next)}`)
  }
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return { detail: text }
  }
}

function shouldWakeRetry(status: number): boolean {
  return status === 502 || status === 503 || status === 504
}

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const headers = new Headers({ Accept: 'application/json' })
  const token = readToken()
  if (options.auth !== false && token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  let body: string | undefined
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(options.body)
  }

  const slowTimer = setTimeout(() => setApiWaking(true), SLOW_MS)

  let response: Response
  try {
    response = await fetch(`${apiBase()}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body,
    })
  } catch (error) {
    clearTimeout(slowTimer)
    if (!options._wakeRetried) {
      setApiWaking(true)
      return api<T>(path, { ...options, _wakeRetried: true })
    }
    setApiWaking(false)
    throw error
  }

  clearTimeout(slowTimer)

  if (shouldWakeRetry(response.status) && !options._wakeRetried) {
    setApiWaking(true)
    return api<T>(path, { ...options, _wakeRetried: true })
  }

  setApiWaking(false)

  if (response.status === 204) return undefined as T

  const data = await parseBody(response)

  if (
    response.status === 401 &&
    options.auth !== false &&
    !options._retried &&
    readRefresh()
  ) {
    const nextAccess = await refreshAccessToken()
    if (nextAccess) {
      return api<T>(path, { ...options, _retried: true })
    }
  }

  if (!response.ok) {
    if (response.status === 401 && options.redirectOn401 !== false) {
      redirectToLogin()
    }
    throw new ApiError(messageFrom(data, response.status), response.status, data)
  }

  return data as T
}
