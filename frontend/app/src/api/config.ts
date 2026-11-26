import { api } from '@/api/client'
import type { AppConfig } from '@/api/types'

export function getConfig(): Promise<AppConfig> {
  return api<AppConfig>('/config/', { auth: false, redirectOn401: false })
}
